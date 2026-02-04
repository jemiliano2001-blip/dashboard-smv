const MONTHS_ES_SHORT = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
] as const

/** Parse YYYY-MM-DD or ISO string to calendar day/month/year without timezone shift (avoids "one day before" in west-of-UTC). */
function parseCalendarParts(dateString: string): { day: number; month: number; year: number } | null {
  const dateOnly = dateString.trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (dateOnly) {
    const [, y, m, d] = dateOnly
    const year = parseInt(y!, 10)
    const month = parseInt(m!, 10)
    const day = parseInt(d!, 10)
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { day, month, year }
    }
  }
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return null
  return {
    day: date.getUTCDate(),
    month: date.getUTCMonth() + 1,
    year: date.getUTCFullYear(),
  }
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A'
  const parts = parseCalendarParts(dateString)
  if (!parts) return 'N/A'
  const monthName = MONTHS_ES_SHORT[parts.month - 1]
  return `${parts.day} ${monthName} ${parts.year}`
}

export function formatDateCompact(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A'
  const parts = parseCalendarParts(dateString)
  if (!parts) return 'N/A'
  const day = String(parts.day).padStart(2, '0')
  const month = String(parts.month).padStart(2, '0')
  const year = String(parts.year).slice(-2)
  return `${day}/${month}/${year}`
}
