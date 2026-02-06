/**
 * Bulk upload parser: reads Excel (.xlsx, .xls) or CSV and maps rows to WorkOrderCreateInput.
 * Report columns: orden, fecha, cantidad, descripción o número de parte, compañía.
 */

import * as XLSX from 'xlsx-js-style'
import Papa from 'papaparse'
import type { WorkOrderCreateInput, Status } from '../types'
import { INPUT_LIMITS, VALID_STATUSES, VALID_PRIORITIES } from './constants'
import { sanitizeText, sanitizeNumber, sanitizeDate, sanitizeEnum } from './sanitize'
import {
  toTitleCaseCompany,
  orderKeyByPo,
  padPoToFiveDigits,
  normalizePartNameForComparison,
} from './formatUtils'

const STATUS_MAP: Record<string, Status> = {
  programada: 'scheduled',
  scheduled: 'scheduled',
  'en producción': 'production',
  production: 'production',
  calidad: 'quality',
  quality: 'quality',
  hold: 'hold',
  'en hold': 'hold',
}

const NORMALIZED_HEADERS: Record<string, string> = {
  orden: 'Orden',
  'no. orden': 'Orden',
  'no orden': 'Orden',
  'numero orden': 'Orden',
  'número orden': 'Orden',
  'numero de orden': 'Orden',
  'número de orden': 'Orden',
  'orden de compra': 'Orden',
  order: 'Orden',
  po: 'Orden',
  'po number': 'Orden',
  'purchase order': 'Orden',
  so: 'Orden',
  'so/orden': 'Orden',
  'so / orden': 'Orden',
  'nº orden': 'Orden',
  'num. orden': 'Orden',
  'num orden': 'Orden',
  'orden ': 'Orden',
  'no. de orden': 'Orden',
  'número de orden': 'Orden',
  'numero parte': 'NumeroParte',
  ref: 'Orden',
  referencia: 'Orden',
  'order #': 'Orden',
  'order number': 'Orden',
  'número de parte': 'NumeroParte',
  numeroparte: 'NumeroParte',
  descripcion: 'Descripcion',
  'descripción': 'Descripcion',
  'descripcion o numero de parte': 'Parte',
  'descripción o número de parte': 'Parte',
  parte: 'Parte',
  cantidad: 'Cantidad',
  fecha: 'Fecha',
  'fecha de creacion': 'Fecha',
  'fecha de creación': 'Fecha',
  'fecha creacion': 'Fecha',
  'fecha creación': 'Fecha',
  estatus: 'Estatus',
  status: 'Estatus',
  compania: 'Compania',
  compañía: 'Compania',
  companía: 'Compania',
}

export interface BulkParseResult {
  rows: WorkOrderCreateInput[]
  errors: Array<{ row: number; message: string }>
}

export interface BulkParseOptions {
  companyName?: string
}

function normalizeHeader(name: string): string {
  const key = String(name || '').trim().toLowerCase().replace(/\s+/g, ' ')
  return NORMALIZED_HEADERS[key] ?? String(name || '').trim()
}

function getCell(row: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k]
    if (v !== undefined && v !== null && v !== '') {
      return String(v).trim()
    }
  }
  return ''
}

/** First non-empty cell value in row (by object key order). Use as fallback for Orden when header is unknown. */
function getFirstNonEmptyCell(row: Record<string, unknown>): string {
  for (const v of Object.values(row)) {
    if (v !== undefined && v !== null && v !== '') {
      const s = String(v).trim()
      if (s) return s
    }
  }
  return ''
}

function normalizePoNumber(value: string): string {
  const s = value.trim()
  const withoutPrefix = s.replace(/^SO\s*\/?\s*/i, '').replace(/^PO\s*\/?\s*/i, '').trim()
  const base = (withoutPrefix || s).slice(0, INPUT_LIMITS.PO_NUMBER_MAX)
  const padded = padPoToFiveDigits(base)
  return padded || base
}

function parsePartNameFromCells(
  row: Record<string, unknown>
): string {
  const parte = getCell(row, 'Parte', 'Descripcion', 'NumeroParte', 'Numero Parte', 'Descripción')
  if (parte) {
    const trimmed = parte.trim().slice(0, INPUT_LIMITS.PART_NAME_MAX)
    return trimmed || 'Sin nombre'
  }
  const numeroParte = getCell(row, 'NumeroParte', 'Numero Parte')
  const descripcion = getCell(row, 'Descripcion', 'Descripción')
  const np = String(numeroParte || '').trim()
  const desc = String(descripcion || '').trim()
  const combined = np ? (desc ? `${np} - ${desc}` : np) : desc
  return combined.slice(0, INPUT_LIMITS.PART_NAME_MAX) || 'Sin nombre'
}

function parseQuantity(value: unknown): number {
  if (value === undefined || value === null || value === '') return 0
  const n = typeof value === 'number' ? value : parseInt(String(value).replace(/,/g, ''), 10)
  return Number.isNaN(n) || n < 0 ? 0 : Math.min(n, INPUT_LIMITS.QUANTITY_MAX)
}

function excelSerialToISO(serial: number): string {
  const utcMs = (serial - 25569) * 86400 * 1000
  const d = new Date(utcMs)
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}

function parseDate(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return new Date().toISOString()
  }
  if (typeof value === 'number') {
    if (value > 0) {
      return excelSerialToISO(value)
    }
  }
  const str = String(value).trim()
  const parsed = new Date(str)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString()
  }
  return new Date().toISOString()
}

function mapStatus(value: string): Status {
  const key = value.trim().toLowerCase()
  if (!key) return 'scheduled'
  const mapped = STATUS_MAP[key]
  if (mapped) return mapped
  for (const [k, v] of Object.entries(STATUS_MAP)) {
    if (k.includes(key) || key.includes(k)) return v
  }
  return 'scheduled'
}

function sanitizeCompanyName(value: string): string {
  const s = sanitizeText(value, INPUT_LIMITS.COMPANY_NAME_MAX).trim()
  return s ? toTitleCaseCompany(s) : ''
}

function validateAndSanitizeBulkRow(
  raw: WorkOrderCreateInput,
  rowIndex: number,
  errors: Array<{ row: number; message: string }>
): WorkOrderCreateInput | null {
  const rawCompany = sanitizeText(raw.company_name, INPUT_LIMITS.COMPANY_NAME_MAX).trim()
  const company_name = rawCompany ? toTitleCaseCompany(rawCompany) : ''
  if (!company_name) {
    errors.push({ row: rowIndex, message: 'Nombre de compañía vacío' })
    return null
  }

  const po_number = sanitizeText(raw.po_number, INPUT_LIMITS.PO_NUMBER_MAX).trim()
  if (!po_number) {
    errors.push({ row: rowIndex, message: 'Número de PO vacío o inválido' })
    return null
  }

  const part_name = sanitizeText(raw.part_name, INPUT_LIMITS.PART_NAME_MAX).trim()
  if (!part_name) {
    errors.push({ row: rowIndex, message: 'Nombre de parte vacío' })
    return null
  }

  const quantity_total = sanitizeNumber(
    raw.quantity_total,
    INPUT_LIMITS.QUANTITY_MIN,
    INPUT_LIMITS.QUANTITY_MAX,
    0
  )
  if (quantity_total < 0) {
    errors.push({ row: rowIndex, message: 'Cantidad inválida' })
    return null
  }

  const status = sanitizeEnum(raw.status, VALID_STATUSES, 'scheduled')
  const priority = sanitizeEnum(raw.priority, VALID_PRIORITIES, 'normal')
  const created_at = raw.created_at
    ? (sanitizeDate(String(raw.created_at)) ?? new Date().toISOString())
    : new Date().toISOString()

  return {
    company_name,
    po_number,
    part_name,
    quantity_total,
    quantity_completed: 0,
    priority,
    status,
    created_at,
  }
}

function mapRowToCreateInput(
  row: Record<string, unknown>,
  rowIndex: number,
  defaultCompanyName: string,
  errors: Array<{ row: number; message: string }>
): WorkOrderCreateInput | null {
  const orden = getCell(row, 'Orden', 'Orden ')
  const cantidadRaw = row['Cantidad'] ?? row['Cantidad ']
  const fechaRaw = row['Fecha'] ?? row['Fecha ']
  const estatusRaw = getCell(row, 'Estatus', 'Status', 'Estatus ')

  const companyCell = getCell(row, 'Compania', 'Compañía')
  const company_name = companyCell
    ? sanitizeCompanyName(companyCell)
    : sanitizeCompanyName(defaultCompanyName)
  if (!company_name) {
    errors.push({ row: rowIndex, message: 'Falta compañía (use columna o valor por defecto)' })
    return null
  }

  if (!orden) {
    errors.push({ row: rowIndex, message: 'Falta Orden (número de PO)' })
    return null
  }

  let po_number = normalizePoNumber(orden)
  if (!po_number) {
    errors.push({ row: rowIndex, message: 'Orden inválida' })
    return null
  }
  po_number = padPoToFiveDigits(po_number) || po_number
  if (po_number.length > INPUT_LIMITS.PO_NUMBER_MAX) {
    po_number = po_number.slice(0, INPUT_LIMITS.PO_NUMBER_MAX)
  }

  const part_name = parsePartNameFromCells(row)
  const quantity_total = parseQuantity(cantidadRaw)
  const created_at = parseDate(fechaRaw)
  const status = mapStatus(estatusRaw)

  const rawInput: WorkOrderCreateInput = {
    company_name,
    po_number,
    part_name,
    quantity_total,
    quantity_completed: 0,
    priority: 'normal',
    status,
    created_at,
  }

  return validateAndSanitizeBulkRow(rawInput, rowIndex, errors)
}

function normalizeRowKeys(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(raw)) {
    const normalized = normalizeHeader(k)
    if (normalized) {
      out[normalized] = v
    }
  }
  return out
}

async function readExcelFile(file: File): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) return []
  const sheet = workbook.Sheets[firstSheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
  return rows.map((r) => normalizeRowKeys(r))
}

function readCsvString(csvText: string): Record<string, unknown>[] {
  const parsed = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    skipEmptyLines: true,
  })
  if (parsed.errors.length) {
    throw new Error(parsed.errors.map((e) => e.message).join('; '))
  }
  return (parsed.data || []).map((r) => normalizeRowKeys(r))
}

export async function parseBulkUploadFile(
  file: File,
  options: BulkParseOptions = {}
): Promise<BulkParseResult> {
  const companyName = options.companyName ?? 'Importación'
  const errors: Array<{ row: number; message: string }> = []
  const rows: WorkOrderCreateInput[] = []

  const ext = (file.name || '').toLowerCase()
  let rawRows: Record<string, unknown>[]

  if (ext.endsWith('.xlsx') || ext.endsWith('.xls')) {
    rawRows = await readExcelFile(file)
  } else if (ext.endsWith('.csv')) {
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.onerror = () => reject(reader.error)
      reader.readAsText(file, 'UTF-8')
    })
    rawRows = readCsvString(text)
  } else {
    return {
      rows: [],
      errors: [{ row: 0, message: 'Formato no soportado. Use .xlsx, .xls o .csv' }],
    }
  }

  let lastOrden = ''
  let lastCompania = ''
  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i]
    const hasAny = Object.values(raw).some((v) => v !== undefined && v !== null && v !== '')
    if (!hasAny) continue

    const ordenCell = getCell(raw, 'Orden', 'Orden ')
    const firstCell = getFirstNonEmptyCell(raw)
    const ordenFallback = ordenCell || firstCell || lastOrden
    if (ordenCell || firstCell) lastOrden = normalizePoNumber(ordenCell || firstCell)
    const effectiveOrden = ordenFallback
    const rawWithOrden: Record<string, unknown> = effectiveOrden ? { ...raw, Orden: effectiveOrden } : raw

    const companyCell = getCell(rawWithOrden, 'Compania', 'Compañía')
    if (companyCell) lastCompania = companyCell
    const effectiveCompania = companyCell || lastCompania
    const rawWithBoth: Record<string, unknown> = { ...rawWithOrden }
    if (effectiveCompania) rawWithBoth.Compania = effectiveCompania

    const mapped = mapRowToCreateInput(rawWithBoth, i + 2, companyName, errors)
    if (mapped) rows.push(mapped)
  }

  const groupByKey = new Map<string, WorkOrderCreateInput[]>()
  for (const row of rows) {
    const key = orderKeyByPo(row.company_name, row.po_number)
    const list = groupByKey.get(key) ?? []
    list.push(row)
    groupByKey.set(key, list)
  }

  const grouped: WorkOrderCreateInput[] = []
  for (const list of groupByKey.values()) {
    const first = list[0]
    const partNamesSeen = new Set<string>()
    const partNames: string[] = []
    for (const row of list) {
      const norm = normalizePartNameForComparison(row.part_name)
      if (norm && !partNamesSeen.has(norm)) {
        partNamesSeen.add(norm)
        partNames.push(row.part_name.trim())
      }
    }
    const part_name = partNames.join(', ').slice(0, INPUT_LIMITS.PART_NAME_MAX)
    const quantity_total = list.reduce((sum, r) => sum + (r.quantity_total ?? 0), 0)
    grouped.push({
      company_name: first.company_name,
      po_number: first.po_number,
      part_name: part_name || first.part_name,
      quantity_total,
      quantity_completed: 0,
      priority: first.priority ?? 'normal',
      status: first.status ?? 'scheduled',
      created_at: first.created_at ?? new Date().toISOString(),
    })
  }

  return { rows: grouped, errors }
}
