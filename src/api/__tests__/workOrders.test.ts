import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  fetchWorkOrders,
  fetchWorkOrderById,
  createWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
  updateWorkOrderStatus,
  updateWorkOrderPriority,
} from '../workOrders'
import type { WorkOrder, WorkOrderFormData } from '../../types'

const mockOrder: WorkOrder = {
  id: 'uuid-1',
  company_name: 'Acme',
  po_number: 'PO-001',
  part_name: 'Widget',
  quantity_total: 100,
  quantity_completed: 50,
  priority: 'normal',
  status: 'production',
  created_at: '2024-01-01T00:00:00Z',
}

const mockFormData: WorkOrderFormData = {
  company_name: 'Acme',
  po_number: 'PO-001',
  part_name: 'Widget',
  quantity_total: 100,
  quantity_completed: 50,
  priority: 'normal',
  status: 'production',
  created_at: '2024-01-01',
}

function createChain(returnValue: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(returnValue),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  }
  // fetchWorkOrders uses .select().order().order() - second order() returns the awaited result
  chain.order = vi.fn().mockReturnValueOnce(chain).mockResolvedValueOnce(returnValue)
  return chain
}

vi.mock('../../utils/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

const { supabase } = await import('../../utils/supabase')

describe('workOrders API', () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockClear()
  })

  describe('fetchWorkOrders', () => {
    it('returns work orders on success', async () => {
      const chain = createChain({ data: [mockOrder], error: null })
      vi.mocked(supabase.from).mockReturnValue(chain as never)

      const result = await fetchWorkOrders()

      expect(supabase.from).toHaveBeenCalledWith('work_orders')
      expect(result).toEqual([mockOrder])
    })

    it('returns empty array when data is null', async () => {
      const chain = createChain({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(chain as never)

      const result = await fetchWorkOrders()

      expect(result).toEqual([])
    })

    it('throws on error', async () => {
      const chain = createChain({ data: null, error: { message: 'Network error' } })
      vi.mocked(supabase.from).mockReturnValue(chain as never)

      await expect(fetchWorkOrders()).rejects.toThrow('Network error')
    })
  })

  describe('fetchWorkOrderById', () => {
    it('returns single work order on success', async () => {
      const chain = createChain({ data: mockOrder, error: null })
      vi.mocked(supabase.from).mockReturnValue(chain as never)

      const result = await fetchWorkOrderById('uuid-1')

      expect(supabase.from).toHaveBeenCalledWith('work_orders')
      expect(chain.eq).toHaveBeenCalledWith('id', 'uuid-1')
      expect(result).toEqual(mockOrder)
    })

    it('throws on error', async () => {
      const chain = createChain({ data: null, error: { message: 'Not found' } })
      vi.mocked(supabase.from).mockReturnValue(chain as never)

      await expect(fetchWorkOrderById('uuid-1')).rejects.toThrow('Not found')
    })
  })

  describe('createWorkOrder', () => {
    it('returns created work order on success', async () => {
      const chain = createChain({ data: mockOrder, error: null })
      vi.mocked(supabase.from).mockReturnValue(chain as never)

      const result = await createWorkOrder(mockFormData)

      expect(supabase.from).toHaveBeenCalledWith('work_orders')
      expect(chain.insert).toHaveBeenCalled()
      expect(result).toEqual(mockOrder)
    })

    it('throws on error', async () => {
      const chain = createChain({ data: null, error: { message: 'Constraint violation' } })
      vi.mocked(supabase.from).mockReturnValue(chain as never)

      await expect(createWorkOrder(mockFormData)).rejects.toThrow('Constraint violation')
    })
  })

  describe('updateWorkOrder', () => {
    it('returns updated work order on success', async () => {
      const updated = { ...mockOrder, company_name: 'Updated Co' }
      const chain = createChain({ data: updated, error: null })
      vi.mocked(supabase.from).mockReturnValue(chain as never)

      const result = await updateWorkOrder('uuid-1', { ...mockFormData, company_name: 'Updated Co' })

      expect(supabase.from).toHaveBeenCalledWith('work_orders')
      expect(chain.update).toHaveBeenCalled()
      expect(chain.eq).toHaveBeenCalledWith('id', 'uuid-1')
      expect(result).toEqual(updated)
    })

    it('throws on error', async () => {
      const chain = createChain({ data: null, error: { message: 'Update failed' } })
      vi.mocked(supabase.from).mockReturnValue(chain as never)

      await expect(updateWorkOrder('uuid-1', mockFormData)).rejects.toThrow('Update failed')
    })
  })

  describe('deleteWorkOrder', () => {
    it('resolves on success', async () => {
      const chain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      vi.mocked(supabase.from).mockReturnValue(chain as never)

      await expect(deleteWorkOrder('uuid-1')).resolves.toBeUndefined()
      expect(chain.delete).toHaveBeenCalled()
      expect(chain.eq).toHaveBeenCalledWith('id', 'uuid-1')
    })

    it('throws on error', async () => {
      const chain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      }
      vi.mocked(supabase.from).mockReturnValue(chain as never)

      await expect(deleteWorkOrder('uuid-1')).rejects.toThrow('Delete failed')
    })
  })

  describe('updateWorkOrderStatus', () => {
    it('returns updated work order on success', async () => {
      const updated = { ...mockOrder, status: 'quality' as const }
      const chain = createChain({ data: updated, error: null })
      vi.mocked(supabase.from).mockReturnValue(chain as never)

      const result = await updateWorkOrderStatus('uuid-1', 'quality')

      expect(chain.update).toHaveBeenCalledWith({ status: 'quality' })
      expect(result).toEqual(updated)
    })
  })

  describe('updateWorkOrderPriority', () => {
    it('returns updated work order on success', async () => {
      const updated = { ...mockOrder, priority: 'high' as const }
      const chain = createChain({ data: updated, error: null })
      vi.mocked(supabase.from).mockReturnValue(chain as never)

      const result = await updateWorkOrderPriority('uuid-1', 'high')

      expect(chain.update).toHaveBeenCalledWith({ priority: 'high' })
      expect(result).toEqual(updated)
    })
  })
})
