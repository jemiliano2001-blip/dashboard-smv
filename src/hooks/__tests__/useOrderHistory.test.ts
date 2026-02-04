import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useOrderHistory } from '../useOrderHistory'
import type { WorkOrderHistory } from '../../types/history'

const mockHistory: WorkOrderHistory[] = [
  {
    id: 'h1',
    work_order_id: 'order-1',
    changed_field: 'status',
    old_value: 'scheduled',
    new_value: 'production',
    changed_by: null,
    change_type: 'update',
    created_at: '2024-01-01T12:00:00Z',
  },
]

function createMockFrom(returnData: WorkOrderHistory[] | null, returnError: { message: string } | null) {
  const result = { data: returnData, error: returnError }
  const thenable = {
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    then: vi.fn((resolve: (v: typeof result) => void) => {
      resolve(result)
      return Promise.resolve(result)
    }),
  }
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnValue(thenable),
  }
}

vi.mock('../../utils/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

const { supabase } = await import('../../utils/supabase')

describe('useOrderHistory', () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockClear()
  })

  it('returns initial empty history and loading false', () => {
    const { result } = renderHook(() => useOrderHistory())

    expect(result.current.history).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('fetchHistory sets history on success', async () => {
    const chain = createMockFrom(mockHistory, null)
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    const { result } = renderHook(() => useOrderHistory())

    result.current.fetchHistory('order-1')

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.history).toEqual(mockHistory)
    expect(result.current.error).toBeNull()
    expect(supabase.from).toHaveBeenCalledWith('work_orders_history')
  })

  it('fetchHistory sets error on failure', async () => {
    const chain = createMockFrom(null, { message: 'Fetch failed' })
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    const { result } = renderHook(() => useOrderHistory())

    result.current.fetchHistory('order-1')

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })

    expect(result.current.error).toContain('Fetch failed')
    expect(result.current.history).toEqual([])
  })

  it('fetchHistory applies filters when provided', async () => {
    const chain = createMockFrom(mockHistory, null)
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    const { result } = renderHook(() => useOrderHistory())

    result.current.fetchHistory('order-1', {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      changeType: 'update',
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const thenable = vi.mocked(chain.order).mock.results[0]?.value
    expect(thenable?.gte).toHaveBeenCalledWith('created_at', '2024-01-01')
    expect(thenable?.lte).toHaveBeenCalledWith('created_at', '2024-01-31')
  })
})
