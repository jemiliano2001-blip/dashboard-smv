import { useEffect, useMemo, useRef, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { logger } from '@/utils/logger'
import { fetchWorkOrders } from '@/features/orders/api/workOrders'
import { workOrderKeys } from '@/features/orders/api/queryKeys'
import type { WorkOrder } from '@/types'

const MAX_REALTIME_RETRIES = 5

interface UseWorkOrdersReturn {
  workOrders: WorkOrder[]
  ordersByCompany: Record<string, WorkOrder[]>
  companies: string[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Custom hook for managing work orders with React Query and real-time updates from Supabase.
 */
export function useWorkOrders(): UseWorkOrdersReturn {
  const queryClient = useQueryClient()
  const realtimeRetryCountRef = useRef(0)
  const realtimeDisabledRef = useRef(false)

  const {
    data: workOrders = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: workOrderKeys.lists(),
    queryFn: fetchWorkOrders,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (realtimeDisabledRef.current) return

    const channel = supabase
      .channel('work_orders_changes', {
        config: { broadcast: { self: false }, presence: { key: '' } },
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'work_orders' },
        async () => {
          await queryClient.invalidateQueries({ queryKey: workOrderKeys.all })
        }
      )
      .subscribe((status, err) => {
        logger.debug('Realtime channel status', {
          feature: 'work_orders',
          action: 'realtime_status',
          status,
          error: err?.message,
        })

        if (status === 'SUBSCRIBED') {
          realtimeRetryCountRef.current = 0
          realtimeDisabledRef.current = false
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          realtimeRetryCountRef.current += 1
          if (realtimeRetryCountRef.current >= MAX_REALTIME_RETRIES) {
            realtimeDisabledRef.current = true
          }
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  const ordersByCompany = useMemo(() => {
    return workOrders.reduce<Record<string, WorkOrder[]>>((acc, order) => {
      const company = order.company_name || 'Sin Compañía'
      if (!acc[company]) acc[company] = []
      acc[company].push(order)
      return acc
    }, {})
  }, [workOrders])

  const companies = useMemo(() => {
    return Object.keys(ordersByCompany)
      .filter((company) => ordersByCompany[company]?.length > 0)
      .sort()
  }, [ordersByCompany])

  const error = queryError instanceof Error ? queryError.message : queryError ? String(queryError) : null

  const stableRefetch = useCallback(async () => {
    await refetch()
  }, [refetch])

  return {
    workOrders,
    ordersByCompany,
    companies,
    loading,
    error,
    refetch: stableRefetch,
  }
}
