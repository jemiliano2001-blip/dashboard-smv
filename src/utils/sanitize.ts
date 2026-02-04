/**
 * Utility functions for sanitizing user input to prevent XSS attacks
 */

/**
 * Escapes HTML special characters
 * @param text - Text to escape
 * @returns Escaped text safe for HTML
 */
export function escapeHtml(text: string | unknown): string {
  if (typeof text !== 'string') {
    return String(text)
  }
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  
  return text.replace(/[&<>"']/g, (char) => map[char] || char)
}

/**
 * Sanitizes text input by trimming and escaping
 * @param input - Input to sanitize
 * @param maxLength - Maximum allowed length
 * @returns Sanitized text
 */
export function sanitizeText(input: string | unknown, maxLength = 1000): string {
  if (typeof input !== 'string') {
    return ''
  }
  
  return escapeHtml(input.trim().slice(0, maxLength))
}

/**
 * Validates and sanitizes a number input
 * @param input - Input to validate
 * @param min - Minimum value
 * @param max - Maximum value
 * @param defaultValue - Default value if invalid
 * @returns Validated number
 */
export function sanitizeNumber(
  input: string | number | unknown,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  defaultValue = 0
): number {
  const num = typeof input === 'number' ? input : parseInt(String(input), 10)
  
  if (isNaN(num)) {
    return defaultValue
  }
  
  if (num < min) {
    return min
  }
  
  if (num > max) {
    return max
  }
  
  return num
}

/**
 * Validates a date string
 * @param dateString - Date string to validate
 * @returns Valid ISO date string or null
 */
export function sanitizeDate(dateString: string | unknown): string | null {
  if (!dateString || typeof dateString !== 'string') {
    return null
  }
  
  const date = new Date(dateString)
  
  if (isNaN(date.getTime())) {
    return null
  }
  
  return date.toISOString()
}

/**
 * Validates enum value against allowed values
 * @param value - Value to validate
 * @param allowedValues - Array of allowed values
 * @param defaultValue - Default value if invalid
 * @returns Valid enum value
 */
export function sanitizeEnum<T extends string>(
  value: string | unknown,
  allowedValues: readonly T[],
  defaultValue: T
): T {
  if (typeof value !== 'string') {
    return defaultValue
  }
  
  if (allowedValues.includes(value as T)) {
    return value as T
  }
  
  return defaultValue
}
