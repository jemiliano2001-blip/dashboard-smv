/**
 * Validation schemas for runtime type checking and data validation
 * Uses Zod for schema validation and type inference
 */

import { z } from 'zod'
import { sanitizeText, sanitizeNumber, sanitizeDate, sanitizeEnum } from './sanitize'
import type { WorkOrderFormData, Priority, Status } from '../types'
import { INPUT_LIMITS } from './constants'
import { localDateStringToISO } from './dateFormatter'

const VALID_PRIORITIES: readonly Priority[] = ['low', 'normal', 'high', 'critical'] as const
const VALID_STATUSES: readonly Status[] = ['scheduled', 'production', 'quality', 'hold'] as const

export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

function isValidDateString(str: string): boolean {
  if (DATE_REGEX.test(str)) {
    const [y, m, d] = str.split('-').map(Number)
    const date = new Date(y!, m! - 1, d!, 12, 0, 0, 0)
    return !isNaN(date.getTime()) && date.getUTCFullYear() === y && date.getUTCMonth() + 1 === m
  }
  const parsed = new Date(str)
  return !isNaN(parsed.getTime())
}

export const workOrderSchema = z
  .object({
    company_name: z
      .string()
      .min(1, 'El nombre de la compañía es requerido')
      .max(INPUT_LIMITS.COMPANY_NAME_MAX, `El nombre debe tener máximo ${INPUT_LIMITS.COMPANY_NAME_MAX} caracteres`)
      .transform((s) => s.trim()),
    po_number: z
      .string()
      .min(1, 'El número de PO es requerido')
      .max(INPUT_LIMITS.PO_NUMBER_MAX, `El número de PO debe tener máximo ${INPUT_LIMITS.PO_NUMBER_MAX} caracteres`)
      .transform((s) => s.trim()),
    part_name: z
      .string()
      .min(1, 'El nombre de la pieza es requerido')
      .max(INPUT_LIMITS.PART_NAME_MAX, `El nombre de pieza debe tener máximo ${INPUT_LIMITS.PART_NAME_MAX} caracteres`)
      .transform((s) => s.trim()),
    quantity_total: z
      .number()
      .int('La cantidad total debe ser un número entero')
      .min(0, 'La cantidad total debe ser mayor o igual a 0'),
    quantity_completed: z
      .number()
      .int('La cantidad completada debe ser un número entero')
      .min(0, 'La cantidad completada debe ser mayor o igual a 0'),
    priority: z.enum(['low', 'normal', 'high', 'critical'], {
      error: 'Prioridad inválida',
    }),
    status: z.enum(['scheduled', 'production', 'quality', 'hold'], {
      error: 'Estado inválido',
    }),
    created_at: z.string().refine(isValidDateString, 'La fecha de creación no es válida'),
  })
  .refine(
    (data) => data.quantity_completed <= data.quantity_total,
    {
      message: 'La cantidad completada no puede ser mayor que la cantidad total',
      path: ['quantity_completed'],
    }
  )

export type WorkOrderSchemaOutput = z.infer<typeof workOrderSchema>

function zodErrorsToRecord(
  error: z.ZodError
): Record<string, string> {
  const result: Record<string, string> = {}
  const flat = error.flatten().fieldErrors
  for (const [key, messages] of Object.entries(flat)) {
    const arr = Array.isArray(messages) ? messages : []
    if (arr.length > 0 && typeof arr[0] === 'string') {
      result[key] = arr[0]
    }
  }
  return result
}

/**
 * Validates a work order using Zod schema
 * @param data - Data to validate (unknown, can include raw form values)
 * @returns Validation result with sanitized data and errors
 */
export function validateWorkOrder(
  data: unknown
): ValidationResult & { sanitized?: WorkOrderFormData } {
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: { _general: 'Invalid data format' } }
  }

  const input = data as Record<string, unknown>

  const preprocess: Record<string, unknown> = {
    company_name: typeof input.company_name === 'string' ? input.company_name : '',
    po_number: typeof input.po_number === 'string' ? input.po_number : '',
    part_name: typeof input.part_name === 'string' ? input.part_name : '',
    quantity_total:
      typeof input.quantity_total === 'number'
        ? input.quantity_total
        : sanitizeNumber(input.quantity_total, 0, Number.MAX_SAFE_INTEGER, 0),
    quantity_completed:
      typeof input.quantity_completed === 'number'
        ? input.quantity_completed
        : sanitizeNumber(input.quantity_completed, 0, Number.MAX_SAFE_INTEGER, 0),
    priority: sanitizeEnum(input.priority, VALID_PRIORITIES, 'normal'),
    status: sanitizeEnum(input.status, VALID_STATUSES, 'scheduled'),
    created_at:
      input.created_at != null
        ? String(input.created_at)
        : new Date().toISOString().slice(0, 10),
  }

  const result = workOrderSchema.safeParse(preprocess)

  if (result.success) {
    const validated = result.data
    const createdAt =
      DATE_REGEX.test(validated.created_at)
        ? localDateStringToISO(validated.created_at)
        : (sanitizeDate(validated.created_at) ?? new Date().toISOString())

    return {
      valid: true,
      errors: {},
      sanitized: {
        company_name: sanitizeText(validated.company_name, INPUT_LIMITS.COMPANY_NAME_MAX),
        po_number: sanitizeText(validated.po_number, INPUT_LIMITS.PO_NUMBER_MAX),
        part_name: sanitizeText(validated.part_name, INPUT_LIMITS.PART_NAME_MAX),
        quantity_total: validated.quantity_total,
        quantity_completed: validated.quantity_completed,
        priority: validated.priority,
        status: validated.status,
        created_at: createdAt,
      },
    }
  }

  return {
    valid: false,
    errors: zodErrorsToRecord(result.error),
  }
}

/**
 * @deprecated Use validateWorkOrder instead. Kept for backwards compatibility.
 */
export function validateWorkOrderFormData(
  data: unknown
): ValidationResult & { sanitized?: WorkOrderFormData } {
  return validateWorkOrder(data)
}

/**
 * Validates a WorkOrder ID
 * @param id - ID to validate
 * @returns True if valid UUID format
 */
export function validateWorkOrderId(id: unknown): boolean {
  if (typeof id !== 'string') return false
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidPattern.test(id)
}

/**
 * Validates search input
 * @param searchTerm - Search term to validate
 * @returns Sanitized search term
 */
export function validateSearchInput(searchTerm: unknown): string {
  if (typeof searchTerm !== 'string') return ''
  return sanitizeText(searchTerm, 500)
}

/**
 * Validates filter values
 * @param filterValue - Filter value to validate
 * @param allowedValues - Array of allowed values
 * @returns Validated filter value or empty string
 */
export function validateFilterValue<T extends string>(
  filterValue: unknown,
  allowedValues: readonly T[]
): T | '' {
  if (!filterValue || typeof filterValue !== 'string') return ''
  return sanitizeEnum(filterValue, allowedValues, '' as T) || ''
}
