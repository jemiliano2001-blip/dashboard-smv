/**
 * Validation schemas for runtime type checking and data validation
 * This can be migrated to Zod in the future for better type inference
 */

import { sanitizeText, sanitizeNumber, sanitizeDate, sanitizeEnum } from './sanitize'
import type { WorkOrderFormData, Priority, Status } from '../types'
import { INPUT_LIMITS } from './constants'

const VALID_PRIORITIES: readonly Priority[] = ['low', 'normal', 'high', 'critical'] as const
const VALID_STATUSES: readonly Status[] = ['scheduled', 'production', 'quality', 'hold'] as const

export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

/**
 * Validates and sanitizes a WorkOrderFormData object
 * @param data - Data to validate
 * @returns Validation result with sanitized data and errors
 */
export function validateWorkOrderFormData(data: unknown): ValidationResult & { sanitized?: WorkOrderFormData } {
  const errors: Record<string, string> = {}

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: { _general: 'Invalid data format' } }
  }

  const input = data as Record<string, unknown>

  // Validate and sanitize company_name
  const companyName = sanitizeText(input.company_name, INPUT_LIMITS.COMPANY_NAME_MAX)
  if (!companyName || companyName.trim() === '') {
    errors.company_name = 'El nombre de la compañía es requerido'
  }

  // Validate and sanitize po_number
  const poNumber = sanitizeText(input.po_number, INPUT_LIMITS.PO_NUMBER_MAX)
  if (!poNumber || poNumber.trim() === '') {
    errors.po_number = 'El número de PO es requerido'
  }

  // Validate and sanitize part_name
  const partName = sanitizeText(input.part_name, INPUT_LIMITS.PART_NAME_MAX)
  if (!partName || partName.trim() === '') {
    errors.part_name = 'El nombre de la pieza es requerido'
  }

  // Validate and sanitize quantity_total
  const quantityTotal = sanitizeNumber(input.quantity_total, 0, Number.MAX_SAFE_INTEGER, 0)
  if (quantityTotal < 0) {
    errors.quantity_total = 'La cantidad total debe ser mayor o igual a 0'
  }

  // Validate and sanitize quantity_completed
  const quantityCompleted = sanitizeNumber(input.quantity_completed, 0, Number.MAX_SAFE_INTEGER, 0)
  if (quantityCompleted < 0) {
    errors.quantity_completed = 'La cantidad completada debe ser mayor o igual a 0'
  }
  if (quantityCompleted > quantityTotal) {
    errors.quantity_completed = 'La cantidad completada no puede ser mayor que la cantidad total'
  }

  // Validate and sanitize priority
  const priority = sanitizeEnum(input.priority, VALID_PRIORITIES, 'normal')

  // Validate and sanitize status
  const status = sanitizeEnum(input.status, VALID_STATUSES, 'scheduled')

  // Validate and sanitize created_at
  const createdAt = input.created_at
    ? sanitizeDate(String(input.created_at))
    : new Date().toISOString()
  
  if (!createdAt) {
    errors.created_at = 'La fecha de creación no es válida'
  }

  const valid = Object.keys(errors).length === 0

  if (valid) {
    return {
      valid: true,
      errors: {},
      sanitized: {
        company_name: companyName,
        po_number: poNumber,
        part_name: partName,
        quantity_total: quantityTotal,
        quantity_completed: quantityCompleted,
        priority,
        status,
        created_at: createdAt || new Date().toISOString(),
      },
    }
  }

  return { valid: false, errors }
}

/**
 * Validates a WorkOrder ID
 * @param id - ID to validate
 * @returns True if valid UUID format
 */
export function validateWorkOrderId(id: unknown): boolean {
  if (typeof id !== 'string') return false
  // UUID v4 pattern
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
