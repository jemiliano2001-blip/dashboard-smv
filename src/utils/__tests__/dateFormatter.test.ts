import { describe, it, expect } from 'vitest'
import { formatDate } from '../dateFormatter'

describe('dateFormatter', () => {
  it('should format valid dates correctly', () => {
    const date = '2024-01-15T10:30:00Z'
    const result = formatDate(date)
    expect(result).toMatch(/\d{1,2} \w{3} \d{4}/)
  })

  it('should return N/A for invalid dates', () => {
    expect(formatDate('invalid-date')).toBe('N/A')
    expect(formatDate(null)).toBe('N/A')
    expect(formatDate(undefined)).toBe('N/A')
  })
})
