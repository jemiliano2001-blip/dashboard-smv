import { useEffect, useRef } from 'react'
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
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const realtimeRetryCountRef = useRef(0)
  const realtimeDisabledRef = useRef(false)
  const isCleaningUpRef = useRef(false)

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

    if (channelRef.current) {
      isCleaningUpRef.current = true
      try {
        const channel = channelRef.current as unknown as { unsubscribe?: () => void }
        if (channel && typeof channel.unsubscribe === 'function') {
          channel.unsubscribe()
        }
        supabase.removeChannel(channelRef.current)
      } catch {
        // Ignore
      } finally {
        channelRef.current = null
        setTimeout(() => {
          isCleaningUpRef.current = false
        }, 100)
      }
    }

    try {
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
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            if (status === 'CLOSED' && isCleaningUpRef.current) return
            realtimeRetryCountRef.current += 1
            if (realtimeRetryCountRef.current >= MAX_REALTIME_RETRIES) {
              realtimeDisabledRef.current = true
            }
          }
        })

      channelRef.current = channel
    } catch (error) {
      logger.error('Error setting up realtime channel', error as Error, {
        feature: 'work_orders',
        action: 'setup_realtime',
      })
    }
  }, [queryClient])

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        isCleaningUpRef.current = true
        try {
          const channel = channelRef.current as unknown as { unsubscribe?: () => void }
          if (channel && typeof channel.unsubscribe === 'function') {
            channel.unsubscribe()
          }
          supabase.removeChannel(channelRef.current)
        } catch {
          // Ignore
        } finally {
          channelRef.current = null
          isCleaningUpRef.current = false
        }
      }
    }
  }, [])

  const ordersByCompany = workOrders.reduce<Record<string, WorkOrder[]>>((acc, order) => {
    const company = order.company_name || 'Sin Compañía'
    if (!acc[company]) acc[company] = []
    acc[company].push(order)
    return acc
  }, {})

  const companies = Object.keys(ordersByCompany)
    .filter((company) => ordersByCompany[company]?.length > 0)
    .sort()

  const error = queryError instanceof Error ? queryError.message : queryError ? String(queryError) : null

  return {
    workOrders,
    ordersByCompany,
    companies,
    loading,
    error,
    refetch: async () => {
      await refetch()
    },
  }
}
