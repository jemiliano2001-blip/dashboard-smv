import { describe, it, expect } from 'vitest'
import { validateWorkOrderFormData } from '../validationSchemas'

describe('Validación de Órdenes de Trabajo (Zod)', () => {
  it('debe validar una orden correcta', () => {
    const validData = {
      company_name: 'Tesla Inc',
      po_number: 'PO-999',
      part_name: 'Model S Door',
      quantity_total: 100,
      quantity_completed: 50,
      priority: 'high',
      status: 'production',
      created_at: new Date().toISOString(),
    }

    const result = validateWorkOrderFormData(validData)
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual({})
  })

  it('debe fallar si faltan campos requeridos', () => {
    const invalidData = {
      company_name: '',
      quantity_total: -5,
    }

    const result = validateWorkOrderFormData(invalidData)
    expect(result.valid).toBe(false)
    expect(result.errors).toHaveProperty('company_name')
    expect(result.errors).toHaveProperty('po_number')
  })

  it('debe impedir que completado sea mayor que total', () => {
    const logicErrorData = {
      company_name: 'Test',
      po_number: '123',
      part_name: 'Part',
      quantity_total: 10,
      quantity_completed: 20,
      priority: 'normal',
      status: 'scheduled',
      created_at: new Date().toISOString(),
    }

    const result = validateWorkOrderFormData(logicErrorData)
    expect(result.valid).toBe(false)
    expect(result.errors.quantity_completed).toBeDefined()
  })
})
