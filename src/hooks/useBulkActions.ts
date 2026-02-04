import { useState } from 'react'
import { supabase } from '../utils/supabase'
import { logger } from '../utils/logger'
import type { Priority, Status, WorkOrder } from '../types'

interface BulkUpdateResult {
  success: boolean
  updated: number
  failed: number
  errors: string[]
}

export function useBulkActions() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const bulkUpdateStatus = async (
    orderIds: string[],
    status: Status
  ): Promise<BulkUpdateResult> => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: updateError } = await supabase
        .from('work_orders')
        .update({ status })
        .in('id', orderIds)
        .select()

      if (updateError) throw updateError

      setLoading(false)
      return {
        success: true,
        updated: data?.length || 0,
        failed: orderIds.length - (data?.length || 0),
        errors: [],
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar órdenes'
      setError(errorMessage)
      logger.error('Bulk status update failed', err as Error, {
        feature: 'bulk-actions',
        action: 'update-status',
        orderIds,
      })
      setLoading(false)
      return {
        success: false,
        updated: 0,
        failed: orderIds.length,
        errors: [errorMessage],
      }
    }
  }

  const bulkUpdatePriority = async (
    orderIds: string[],
    priority: Priority
  ): Promise<BulkUpdateResult> => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: updateError } = await supabase
        .from('work_orders')
        .update({ priority })
        .in('id', orderIds)
        .select()

      if (updateError) throw updateError

      setLoading(false)
      return {
        success: true,
        updated: data?.length || 0,
        failed: orderIds.length - (data?.length || 0),
        errors: [],
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar órdenes'
      setError(errorMessage)
      logger.error('Bulk priority update failed', err as Error, {
        feature: 'bulk-actions',
        action: 'update-priority',
        orderIds,
      })
      setLoading(false)
      return {
        success: false,
        updated: 0,
        failed: orderIds.length,
        errors: [errorMessage],
      }
    }
  }

  const bulkUpdateCompany = async (
    orderIds: string[],
    companyName: string
  ): Promise<BulkUpdateResult> => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: updateError } = await supabase
        .from('work_orders')
        .update({ company_name: companyName })
        .in('id', orderIds)
        .select()

      if (updateError) throw updateError

      setLoading(false)
      return {
        success: true,
        updated: data?.length || 0,
        failed: orderIds.length - (data?.length || 0),
        errors: [],
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar órdenes'
      setError(errorMessage)
      logger.error('Bulk company update failed', err as Error, {
        feature: 'bulk-actions',
        action: 'update-company',
        orderIds,
      })
      setLoading(false)
      return {
        success: false,
        updated: 0,
        failed: orderIds.length,
        errors: [errorMessage],
      }
    }
  }

  const bulkDelete = async (orderIds: string[]): Promise<BulkUpdateResult> => {
    setLoading(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('work_orders')
        .delete()
        .in('id', orderIds)

      if (deleteError) throw deleteError

      setLoading(false)
      return {
        success: true,
        updated: orderIds.length,
        failed: 0,
        errors: [],
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar órdenes'
      setError(errorMessage)
      logger.error('Bulk delete failed', err as Error, {
        feature: 'bulk-actions',
        action: 'delete',
        orderIds,
      })
      setLoading(false)
      return {
        success: false,
        updated: 0,
        failed: orderIds.length,
        errors: [errorMessage],
      }
    }
  }

  return {
    bulkUpdateStatus,
    bulkUpdatePriority,
    bulkUpdateCompany,
    bulkDelete,
    loading,
    error,
  }
}
