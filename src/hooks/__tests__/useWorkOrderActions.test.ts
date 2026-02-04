import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useWorkOrderActions } from '../useWorkOrderActions'
import type { WorkOrderFormData } from '../../types'

// Mock Supabase
vi.mock('../../utils/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: '1', company_name: 'Test' },
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { id: '1', company_name: 'Updated' },
              error: null,
            })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: null,
          error: null,
        })),
      })),
    })),
  },
}))

describe('useWorkOrderActions', () => {
  const validOrderData: WorkOrderFormData = {
    company_name: 'Test Company',
    po_number: 'PO-001',
    part_name: 'Test Part',
    quantity_total: 100,
    quantity_completed: 50,
    priority: 'normal',
    status: 'production',
    created_at: '2024-01-01',
  }

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useWorkOrderActions())
    
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.success).toBeNull()
  })

  it('should create order successfully', async () => {
    const { result } = renderHook(() => useWorkOrderActions())
    
    await waitFor(async () => {
      const createResult = await result.current.createOrder(validOrderData)
      expect(createResult.success).toBe(true)
    })
  })

  it('should validate order data before creating', async () => {
    const { result } = renderHook(() => useWorkOrderActions())
    
    const invalidData = { ...validOrderData, company_name: '' }
    
    await waitFor(async () => {
      const createResult = await result.current.createOrder(invalidData)
      expect(createResult.success).toBe(false)
      expect(createResult.error).toBeDefined()
    })
  })

  it('should update order successfully', async () => {
    const { result } = renderHook(() => useWorkOrderActions())
    
    await waitFor(async () => {
      const updateResult = await result.current.updateOrder('1', validOrderData)
      expect(updateResult.success).toBe(true)
    })
  })

  it('should delete order successfully', async () => {
    const { result } = renderHook(() => useWorkOrderActions())
    
    await waitFor(async () => {
      const deleteResult = await result.current.deleteOrder('1')
      expect(deleteResult.success).toBe(true)
    })
  })
})
