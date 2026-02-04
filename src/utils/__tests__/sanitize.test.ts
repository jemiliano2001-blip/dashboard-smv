import { describe, it, expect } from 'vitest'
import { sanitizeText, sanitizeNumber, sanitizeDate, sanitizeEnum, escapeHtml } from '../sanitize'

describe('sanitize utilities', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
      expect(escapeHtml("test'value")).toBe('test&#039;value')
      expect(escapeHtml('normal text')).toBe('normal text')
    })

    it('should handle non-string inputs', () => {
      expect(escapeHtml(123)).toBe('123')
      expect(escapeHtml(null)).toBe('null')
    })
  })

  describe('sanitizeText', () => {
    it('should trim and escape text', () => {
      expect(sanitizeText('  test  ')).toBe('test')
      expect(sanitizeText('<script>')).toBe('&lt;script&gt;')
    })

    it('should respect maxLength', () => {
      const longText = 'a'.repeat(100)
      expect(sanitizeText(longText, 10).length).toBeLessThanOrEqual(10)
    })

    it('should return empty string for non-string inputs', () => {
      expect(sanitizeText(null as unknown as string)).toBe('')
      expect(sanitizeText(123 as unknown as string)).toBe('')
    })
  })

  describe('sanitizeNumber', () => {
    it('should parse valid numbers', () => {
      expect(sanitizeNumber('123')).toBe(123)
      expect(sanitizeNumber(456)).toBe(456)
    })

    it('should enforce min/max bounds', () => {
      expect(sanitizeNumber('5', 10, 20)).toBe(10)
      expect(sanitizeNumber('25', 10, 20)).toBe(20)
    })

    it('should return default for invalid input', () => {
      expect(sanitizeNumber('invalid', 0, 100, 50)).toBe(50)
      expect(sanitizeNumber(null as unknown as string, 0, 100, 0)).toBe(0)
    })
  })

  describe('sanitizeDate', () => {
    it('should validate and convert valid dates', () => {
      const result = sanitizeDate('2024-01-15')
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it('should return null for invalid dates', () => {
      expect(sanitizeDate('invalid-date')).toBeNull()
      expect(sanitizeDate('')).toBeNull()
      expect(sanitizeDate(null as unknown as string)).toBeNull()
    })
  })

  describe('sanitizeEnum', () => {
    const validValues = ['low', 'normal', 'high', 'critical'] as const

    it('should return valid enum values', () => {
      expect(sanitizeEnum('high', validValues, 'normal')).toBe('high')
      expect(sanitizeEnum('low', validValues, 'normal')).toBe('low')
    })

    it('should return default for invalid values', () => {
      expect(sanitizeEnum('invalid', validValues, 'normal')).toBe('normal')
      expect(sanitizeEnum(null as unknown as string, validValues, 'normal')).toBe('normal')
    })
  })
})
