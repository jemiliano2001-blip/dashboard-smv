import { describe, it, expect } from 'vitest'
import { formatPoForDisplay, summarizePartNameForDisplay } from '../formatUtils'

describe('formatPoForDisplay', () => {
  it('formats 2026/S00179 as (00179)', () => {
    expect(formatPoForDisplay('2026/S00179')).toBe('(00179)')
  })

  it('formats S00179 as (00179)', () => {
    expect(formatPoForDisplay('S00179')).toBe('(00179)')
  })

  it('formats 179 as (00179)', () => {
    expect(formatPoForDisplay('179')).toBe('(00179)')
  })

  it('formats SO/00179 as (00179)', () => {
    expect(formatPoForDisplay('SO/00179')).toBe('(00179)')
  })

  it('formats PO-2024-001 showing last 5 digits', () => {
    expect(formatPoForDisplay('PO-2024-001')).toBe('(24001)')
  })

  it('formats long PO 202600072 as (00072)', () => {
    expect(formatPoForDisplay('202600072')).toBe('(00072)')
  })

  it('formats SO-prefixed 5-digit POs without stripping leading digits', () => {
    expect(formatPoForDisplay('SO20691')).toBe('(20691)')
    expect(formatPoForDisplay('SO20684')).toBe('(20684)')
    expect(formatPoForDisplay('SO19969')).toBe('(19969)')
    expect(formatPoForDisplay('SO18833')).toBe('(18833)')
  })

  it('returns N/A for empty or null', () => {
    expect(formatPoForDisplay('')).toBe('N/A')
    expect(formatPoForDisplay(null as unknown as string)).toBe('N/A')
    expect(formatPoForDisplay(undefined as unknown as string)).toBe('N/A')
  })

  it('returns original string when no digits', () => {
    expect(formatPoForDisplay('ABC-XYZ')).toBe('ABC-XYZ')
  })
})

describe('summarizePartNameForDisplay', () => {
  it('returns as-is when under maxChars', () => {
    const short = 'Short part'
    expect(summarizePartNameForDisplay(short, 50)).toBe(short)
  })

  it('truncates at word boundary and appends ...', () => {
    const long = 'This is a very long part name that exceeds the limit'
    const result = summarizePartNameForDisplay(long, 25)
    expect(result).toMatch(/\.\.\.$/)
    expect(result.length).toBeLessThanOrEqual(25 + 4)
  })

  it('preserves prefix before " - " and truncates rest', () => {
    const codeDesc = 'CODIGO-123 - Descripción muy larga de la pieza para manufactura'
    const result = summarizePartNameForDisplay(codeDesc, 40)
    expect(result.startsWith('CODIGO-123 - ')).toBe(true)
    expect(result.endsWith('...')).toBe(true)
  })

  it('truncates prefix only when prefix + " - " exceeds maxChars', () => {
    const longPrefix = 'VERY_LONG_CODE_AND_PREFIX - Short'
    const result = summarizePartNameForDisplay(longPrefix, 20)
    expect(result.endsWith('...')).toBe(true)
    expect(result.length).toBeLessThanOrEqual(24)
  })

  it('returns empty string for empty input', () => {
    expect(summarizePartNameForDisplay('', 50)).toBe('')
  })

  it('returns trimmed input when maxChars is 0 or negative (edge)', () => {
    expect(summarizePartNameForDisplay('  abc  ', 0)).toBe('abc')
  })
})
