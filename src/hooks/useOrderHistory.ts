import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { logger } from '../utils/logger'
import type { WorkOrderHistory, OrderHistoryFilter } from '../types/history'

interface UseOrderHistoryReturn {
  history: WorkOrderHistory[]
  loading: boolean
  error: string | null
  fetchHistory: (orderId: string, filters?: OrderHistoryFilter) => Promise<void>
}

export function useOrderHistory(): UseOrderHistoryReturn {
  const [history, setHistory] = useState<WorkOrderHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = async (orderId: string, filters?: OrderHistoryFilter) => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('work_orders_history')
        .select('*')
        .eq('work_order_id', orderId)
        .order('created_at', { ascending: false })

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate)
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate)
      }

      if (filters?.changeType) {
        query = query.eq('change_type', filters.changeType)
      }

      if (filters?.changedField) {
        query = query.eq('changed_field', filters.changedField)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setHistory((data as WorkOrderHistory[]) || [])
    } catch (err) {
      const error = err as Error
      logger.error('Error fetching order history', error, {
        feature: 'order_history',
        action: 'fetch',
        orderId,
      })
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return {
    history,
    loading,
    error,
    fetchHistory,
  }
}
