import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useWorkOrders } from '../useWorkOrders'
import type { WorkOrder } from '../../types'

const mockOrders: WorkOrder[] = [
  {
    id: '1',
    company_name: 'Acme',
    po_number: 'PO-001',
    part_name: 'Part A',
    quantity_total: 100,
    quantity_completed: 50,
    priority: 'normal',
    status: 'production',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    company_name: 'Acme',
    po_number: 'PO-002',
    part_name: 'Part B',
    quantity_total: 200,
    quantity_completed: 0,
    priority: 'high',
    status: 'scheduled',
    created_at: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    company_name: 'Beta',
    po_number: 'PO-003',
    part_name: 'Part C',
    quantity_total: 50,
    quantity_completed: 50,
    priority: 'low',
    status: 'quality',
    created_at: '2024-01-03T00:00:00Z',
  },
]

const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockImplementation((cb: (status: string) => void) => {
    cb?.('SUBSCRIBED')
    return { unsubscribe: vi.fn() }
  }),
}

vi.mock('../../utils/supabase', () => ({
  supabase: {
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
  },
}))

vi.mock('../../api/workOrders', () => ({
  fetchWorkOrders: vi.fn(),
}))

const { fetchWorkOrders } = await import('../../api/workOrders')

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe('useWorkOrders', () => {
  beforeEach(() => {
    vi.mocked(fetchWorkOrders).mockResolvedValue(mockOrders)
    mockChannel.on.mockClear()
    mockChannel.subscribe.mockClear()
  })

  it('returns work orders and groups by company', async () => {
    const { result } = renderHook(() => useWorkOrders(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.workOrders).toHaveLength(3)
    expect(result.current.companies).toEqual(['Acme', 'Beta'])
    expect(result.current.ordersByCompany.Acme).toHaveLength(2)
    expect(result.current.ordersByCompany.Beta).toHaveLength(1)
    expect(result.current.error).toBeNull()
  })

  it('returns loading true initially', () => {
    vi.mocked(fetchWorkOrders).mockImplementation(() => new Promise(() => {}))
    const { result } = renderHook(() => useWorkOrders(), {
      wrapper: createWrapper(),
    })

    expect(result.current.loading).toBe(true)
  })

  it('returns error when fetch fails', async () => {
    vi.mocked(fetchWorkOrders).mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useWorkOrders(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })

    expect(result.current.error).toContain('Network error')
  })

  it('refetch calls fetch again', async () => {
    const { result } = renderHook(() => useWorkOrders(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(fetchWorkOrders).toHaveBeenCalledTimes(1)
    await result.current.refetch()
    expect(fetchWorkOrders).toHaveBeenCalledTimes(2)
  })
})
