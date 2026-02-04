/**
 * Utility functions for formatting values in a user-friendly way
 */

/** Collapse whitespace to single space and trim */
function collapseSpaces(s: string): string {
  return s.trim().replace(/\s+/g, ' ')
}

/**
 * Title-case for company names: first letter of each word uppercase, rest lowercase.
 * Words of 2–5 chars are shown in uppercase as acronyms (e.g. AFX, OHD, USA).
 */
export function toTitleCaseCompany(name: string): string {
  const normalized = collapseSpaces(String(name || ''))
  if (!normalized) return ''
  return normalized
    .split(' ')
    .map((word) => {
      if (word.length >= 2 && word.length <= 5) return word.toUpperCase()
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

/**
 * Normalize company name for duplicate comparison: lowercase, collapse spaces.
 */
export function normalizeCompanyForComparison(company_name: string): string {
  return collapseSpaces(String(company_name || '')).toLowerCase()
}

const PO_PADDED_LENGTH = 5

/**
 * Extract digits from PO string and pad to 5 digits with leading zeros (e.g. 206 -> 00206).
 * If the number has more than 5 digits, take only the last 5 (e.g. 202600072 -> 00072).
 */
export function padPoToFiveDigits(po_number: string): string {
  const digits = String(po_number || '').replace(/\D/g, '')
  if (!digits) return ''
  const lastFive = digits.length > PO_PADDED_LENGTH ? digits.slice(-PO_PADDED_LENGTH) : digits
  return lastFive.padStart(PO_PADDED_LENGTH, '0')
}

/**
 * Normalize PO number for duplicate comparison: strip SO/PO prefixes, digits only, pad to 5.
 */
export function normalizePoForComparison(po_number: string): string {
  let s = String(po_number || '').trim()
  s = s.replace(/^SO\s*\/?\s*/i, '').replace(/^PO\s*\/?\s*/i, '').trim()
  const padded = padPoToFiveDigits(s)
  if (padded) return padded
  const alnum = s.replace(/\s+/g, '').replace(/[^a-z0-9]/gi, '').toLowerCase()
  return alnum || collapseSpaces(s).toLowerCase()
}

/**
 * Format PO for display: always show as (XXXXX), e.g. 2026/S00179 -> (00179).
 * Strips SO/PO/year prefixes, extracts digits, pads to 5. Full value remains in tooltip/aria/form/export.
 */
export function formatPoForDisplay(po_number: string): string {
  if (!po_number || typeof po_number !== 'string') return 'N/A'
  let s = po_number.trim()
  s = s.replace(/^SO\s*\/?\s*/i, '').replace(/^PO\s*\/?\s*/i, '').trim()
  if (s.includes('/')) {
    s = s.replace(/^(19|20)\d{2}\/?S?/i, '').trim()
  }
  const padded = padPoToFiveDigits(s)
  if (padded) return `(${padded})`
  return po_number
}

/**
 * Truncate string at last space before maxChars to avoid breaking words; append ellipsis.
 */
function truncateAtWord(s: string, maxChars: number): string {
  const trimmed = s.trim()
  if (trimmed.length <= maxChars) return trimmed
  const slice = trimmed.slice(0, maxChars)
  const lastSpace = slice.lastIndexOf(' ')
  const cut = lastSpace > 0 ? lastSpace : maxChars
  return trimmed.slice(0, cut).trim() + '...'
}

/**
 * Smart summary of part_name for display: preserve "Code - description" structure, truncate by words.
 * Full part_name should be shown in tooltip (title) / form / export.
 */
export function summarizePartNameForDisplay(part_name: string, maxChars: number): string {
  const raw = String(part_name || '').trim()
  if (!raw || maxChars < 1) return raw
  if (raw.length <= maxChars) return raw

  const sep = ' - '
  const idx = raw.indexOf(sep)
  if (idx !== -1) {
    const prefix = raw.slice(0, idx).trim()
    const rest = raw.slice(idx + sep.length).trim()
    const prefixAndSepLen = prefix.length + sep.length
    if (prefixAndSepLen >= maxChars) {
      return truncateAtWord(prefix, maxChars)
    }
    const restMax = maxChars - prefixAndSepLen - 3
    if (restMax <= 0) return prefix + sep + '...'
    return prefix + sep + truncateAtWord(rest, restMax)
  }
  return truncateAtWord(raw, maxChars)
}

/**
 * Key for "order already exists" by company + PO only (one order per PO when grouped).
 */
export function orderKeyByPo(company_name: string, po_number: string): string {
  return `${normalizeCompanyForComparison(company_name)}|${normalizePoForComparison(po_number)}`
}

/**
 * Normalize part name for duplicate comparison: lowercase, collapse spaces.
 */
export function normalizePartNameForComparison(part_name: string): string {
  return collapseSpaces(String(part_name || '')).toLowerCase()
}

/**
 * Single key for order identity: company + PO + part, all normalized.
 * Used for smart duplicate detection (bulk upload vs existing, and within-file dedupe).
 */
export function normalizeOrderKeyForComparison(
  company_name: string,
  po_number: string,
  part_name: string
): string {
  const c = normalizeCompanyForComparison(company_name)
  const p = normalizePoForComparison(po_number)
  const n = normalizePartNameForComparison(part_name)
  return `${c}|${p}|${n}`
}

/**
 * Format milliseconds to seconds for display
 */
export function formatSeconds(ms: number): string {
  const seconds = ms / 1000
  if (seconds < 1) {
    return `${ms}ms`
  }
  if (seconds === Math.floor(seconds)) {
    return `${seconds} seg`
  }
  return `${seconds.toFixed(1)} seg`
}

/**
 * Convert seconds to milliseconds
 */
export function secondsToMs(seconds: number): number {
  return seconds * 1000
}

/**
 * Convert milliseconds to seconds
 */
export function msToSeconds(ms: number): number {
  return ms / 1000
}

/**
 * Format rotation time with examples
 */
export function formatRotationTime(seconds: number): string {
  const perMinute = 60 / seconds
  if (perMinute >= 1) {
    return `${seconds} seg (${perMinute.toFixed(1)} por minuto)`
  }
  return `${seconds} seg`
}

/**
 * Format breakpoint name with description
 */
export function formatBreakpointName(breakpoint: string): string {
  const breakpoints: Record<string, string> = {
    default: 'Móvil/Tablet (< 1024px)',
    lg: 'Pantalla Grande (≥ 1024px)',
    xl: 'Pantalla Extra Grande (≥ 1280px)',
    '2xl': 'Pantalla Muy Grande (≥ 1536px)',
  }
  return breakpoints[breakpoint] || breakpoint
}

/**
 * Calculate and format capacity
 */
export function formatCapacity(columns: number, rows: number): string {
  const total = columns * rows
  return `${total} órdenes (${columns} × ${rows})`
}

/**
 * Get capacity status (sufficient, warning, insufficient)
 */
export type CapacityStatus = 'sufficient' | 'warning' | 'insufficient'

export function getCapacityStatus(
  capacity: number,
  ordersPerPage: number
): CapacityStatus {
  if (capacity >= ordersPerPage) {
    return 'sufficient'
  }
  if (capacity >= ordersPerPage * 0.8) {
    return 'warning'
  }
  return 'insufficient'
}

/**
 * Format capacity with status indicator
 */
export function formatCapacityStatus(
  columns: number,
  rows: number,
  ordersPerPage: number
): { text: string; status: CapacityStatus; total: number } {
  const total = columns * rows
  const status = getCapacityStatus(total, ordersPerPage)
  return {
    text: `${total} tarjetas`,
    status,
    total,
  }
}

/**
 * Get suggestion for fixing capacity issues
 */
export function getCapacitySuggestion(
  columns: number,
  rows: number,
  ordersPerPage: number
): string | null {
  const capacity = columns * rows
  if (capacity >= ordersPerPage) {
    return null
  }

  const needed = ordersPerPage

  // Try increasing rows first
  const rowsNeeded = Math.ceil(needed / columns)
  if (rowsNeeded <= 10) {
    return `Aumenta las filas a ${rowsNeeded} para mostrar todas las órdenes`
  }

  // Try increasing columns
  const colsNeeded = Math.ceil(needed / rows)
  if (colsNeeded <= 12) {
    return `Aumenta las columnas a ${colsNeeded} para mostrar todas las órdenes`
  }

  // Both would exceed limits, suggest both
  return `Aumenta columnas a ${Math.ceil(Math.sqrt(needed))} y filas a ${Math.ceil(Math.sqrt(needed))}`
}

export type PartToken =
  | { type: 'text'; value: string }
  | { type: 'quantity'; value: number }

/**
 * Parse part name into lines (one per comma-separated product) and tokens (text vs quantity).
 * Used for rendering with highlighted "n PZS" spans.
 */
export function parsePartNameForDisplay(raw: string): PartToken[][] {
  if (!raw || typeof raw !== 'string') return []
  const items = raw.split(/\s*,\s*/).map((s) => s.trim()).filter(Boolean)
  if (items.length === 0) return []

  return items.map((item) => {
    const tokens: PartToken[] = []
    const re = /\{(\d+)\}/g
    let lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(item)) !== null) {
      if (m.index > lastIndex) {
        tokens.push({ type: 'text', value: item.slice(lastIndex, m.index) })
      }
      tokens.push({ type: 'quantity', value: parseInt(m[1], 10) })
      lastIndex = re.lastIndex
    }
    if (lastIndex < item.length) {
      tokens.push({ type: 'text', value: item.slice(lastIndex) })
    }
    if (tokens.length === 0) {
      tokens.push({ type: 'text', value: item })
    }
    return tokens
  })
}

/**
 * Format part name for display: replace {n} with (xn) and optionally split items by line.
 * Handles dirty strings like "Producto A {4}, Producto B {8}" → "PRODUCTO A (x4)\nPRODUCTO B (x8)".
 */
export function formatPartNameDisplay(raw: string): string {
  if (!raw || typeof raw !== 'string') return ''
  const withQuantities = raw.replace(/\{(\d+)\}/g, '(x$1)')
  const items = withQuantities.split(/\s*,\s*/).map((s) => s.trim()).filter(Boolean)
  return items.length > 1 ? items.join('\n') : withQuantities
}
