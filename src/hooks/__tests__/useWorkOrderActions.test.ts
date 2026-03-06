import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useWorkOrderActions } from '@/features/orders/hooks/useWorkOrderActions'
import type { WorkOrderFormData } from '../../types'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
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
    const { result } = renderHook(() => useWorkOrderActions(), { wrapper: createWrapper() })
    
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should create order successfully', async () => {
    const { result } = renderHook(() => useWorkOrderActions(), { wrapper: createWrapper() })
    
    await waitFor(async () => {
      const createResult = await result.current.createOrder(validOrderData)
      expect(createResult.success).toBe(true)
    })
  })

  it('should validate order data before creating', async () => {
    const { result } = renderHook(() => useWorkOrderActions(), { wrapper: createWrapper() })
    
    const invalidData = { ...validOrderData, company_name: '' }
    
    await waitFor(async () => {
      const createResult = await result.current.createOrder(invalidData)
      expect(createResult.success).toBe(false)
      expect(createResult.error).toBeDefined()
    })
  })

  const VALID_UUID = '550e8400-e29b-4d10-a716-446655440000'

  it('should update order successfully', async () => {
    const { result } = renderHook(() => useWorkOrderActions(), { wrapper: createWrapper() })

    await waitFor(async () => {
      const updateResult = await result.current.updateOrder(VALID_UUID, validOrderData)
      expect(updateResult.success).toBe(true)
    })
  })

  it('should delete order successfully', async () => {
    const { result } = renderHook(() => useWorkOrderActions(), { wrapper: createWrapper() })

    await waitFor(async () => {
      const deleteResult = await result.current.deleteOrder(VALID_UUID)
      expect(deleteResult.success).toBe(true)
    })
  })
})
