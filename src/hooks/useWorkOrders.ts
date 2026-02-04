import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../utils/supabase'
import { logger } from '../utils/logger'
import { fetchWorkOrders } from '../api/workOrders'
import { workOrderKeys } from '../api/queryKeys'
import type { WorkOrder } from '../types'

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
 * 
 * Features:
 * - Automatic caching and background refetching via React Query
 * - Real-time updates via Supabase Realtime
 * - Automatic retry logic
 * - Groups orders by company
 * 
 * @returns Object containing work orders, grouped data, loading state, error state, and refetch function
 * 
 * @example
 * ```tsx
 * const { workOrders, ordersByCompany, companies, loading, error } = useWorkOrders()
 * ```
 */
export function useWorkOrders(): UseWorkOrdersReturn {
  const queryClient = useQueryClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const realtimeRetryCountRef = useRef(0)
  const realtimeDisabledRef = useRef(false)
  const isCleaningUpRef = useRef(false)

  // Use React Query to fetch and cache work orders
  const {
    data: workOrders = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: workOrderKeys.lists(),
    queryFn: fetchWorkOrders,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  // Setup realtime subscription
  useEffect(() => {
    // Skip if realtime is disabled due to repeated failures
    if (realtimeDisabledRef.current) {
      logger.debug('Realtime disabled due to repeated failures', {
        feature: 'work_orders',
        action: 'realtime_disabled',
      })
      return
    }

    // Cleanup existing channel
    if (channelRef.current) {
      isCleaningUpRef.current = true
      try {
        const channel = channelRef.current as unknown as { unsubscribe?: () => void }
        if (channel && typeof channel.unsubscribe === 'function') {
          channel.unsubscribe()
        }
        supabase.removeChannel(channelRef.current)
      } catch (error) {
        logger.debug('Error removing channel (expected during cleanup)', {
          feature: 'work_orders',
          action: 'remove_channel',
        })
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
          config: {
            broadcast: { self: false },
            presence: { key: '' },
          },
        })
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'work_orders',
          },
          async () => {
            // Invalidate and refetch when realtime event occurs
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
            // Ignore CLOSED events during cleanup
            if (status === 'CLOSED' && isCleaningUpRef.current) {
              logger.debug('Ignoring CLOSED event during cleanup', {
                feature: 'work_orders',
                action: 'ignore_cleanup_close',
              })
              return
            }

            realtimeRetryCountRef.current += 1

            // Disable realtime after too many failures
            if (realtimeRetryCountRef.current >= MAX_REALTIME_RETRIES) {
              realtimeDisabledRef.current = true
              logger.warn('Realtime disabled after multiple failures', {
                feature: 'work_orders',
                action: 'realtime_disabled',
                retryCount: realtimeRetryCountRef.current,
              })
              return
            }

            logger.debug('Realtime channel error, will retry', {
              feature: 'work_orders',
              action: 'realtime_error',
              status,
              retryCount: realtimeRetryCountRef.current,
            })
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

  // Cleanup on unmount
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
        } catch (error) {
          // Ignore errors during cleanup
        } finally {
          channelRef.current = null
          isCleaningUpRef.current = false
        }
      }
    }
  }, [])

  // Compute derived data
  const ordersByCompany = workOrders.reduce<Record<string, WorkOrder[]>>((acc, order) => {
    const company = order.company_name || 'Sin Compañía'
    if (!acc[company]) {
      acc[company] = []
    }
    acc[company].push(order)
    return acc
  }, {})

  const companies = Object.keys(ordersByCompany)
    .filter((company) => {
      const orders = ordersByCompany[company]
      return orders && orders.length > 0
    })
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
