import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
  updateWorkOrderStatus,
  updateWorkOrderPriority,
  fetchWorkOrderById,
} from '@/features/orders/api/workOrders'
import { workOrderKeys } from '@/features/orders/api/queryKeys'
import {
  VALIDATION_MESSAGES,
  ERROR_MESSAGES,
  VALID_STATUSES,
} from '@/utils/constants'
import { validateWorkOrderFormData, validateWorkOrderId } from '@/utils/validationSchemas'
import { sanitizeEnum } from '@/utils/sanitize'
import type { WorkOrder, WorkOrderFormData, Priority, Status } from '@/types'

interface UseWorkOrderActionsReturn {
  createOrder: (orderData: WorkOrderFormData) => Promise<{ success: boolean; error?: string }>
  updateOrder: (id: string, orderData: WorkOrderFormData) => Promise<{ success: boolean; error?: string }>
  deleteOrder: (id: string) => Promise<{ success: boolean; error?: string }>
  quickUpdateStatus: (id: string, status: Status) => Promise<{ success: boolean; error?: string }>
  quickUpdatePriority: (id: string, priority: Priority) => Promise<{ success: boolean; error?: string }>
  duplicateOrder: (id: string) => Promise<{ success: boolean; error?: string }>
  loading: boolean
  error: string | null
  success: string | null
  clearMessages: () => void
}

export function useWorkOrderActions(): UseWorkOrderActionsReturn {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: createWorkOrder,
    onMutate: async (newOrder) => {
      await queryClient.cancelQueries({ queryKey: workOrderKeys.lists() })
      const previousOrders = queryClient.getQueryData<WorkOrder[]>(workOrderKeys.lists())
      const optimisticOrder: WorkOrder = { id: `temp-${Date.now()}`, ...newOrder }
      queryClient.setQueryData<WorkOrder[]>(workOrderKeys.lists(), (old = []) => [...old, optimisticOrder])
      return { previousOrders }
    },
    onError: (_error, _newOrder, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(workOrderKeys.lists(), context.previousOrders)
      }
    },
    onSuccess: (newOrder) => {
      queryClient.setQueryData<WorkOrder[]>(workOrderKeys.lists(), (old = []) => {
        const filtered = old.filter((o) => !o.id.startsWith('temp-'))
        return [...filtered, newOrder]
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: WorkOrderFormData }) => updateWorkOrder(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: workOrderKeys.lists() })
      await queryClient.cancelQueries({ queryKey: workOrderKeys.detail(id) })
      const previousOrders = queryClient.getQueryData<WorkOrder[]>(workOrderKeys.lists())
      const previousOrder = queryClient.getQueryData<WorkOrder>(workOrderKeys.detail(id))
      const optimisticOrder: WorkOrder = {
        ...(previousOrder || (previousOrders?.find((o) => o.id === id) as WorkOrder)),
        ...data,
      }
      queryClient.setQueryData<WorkOrder[]>(workOrderKeys.lists(), (old = []) =>
        old.map((order) => (order.id === id ? optimisticOrder : order))
      )
      queryClient.setQueryData(workOrderKeys.detail(id), optimisticOrder)
      return { previousOrders, previousOrder }
    },
    onError: (_error, { id }, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(workOrderKeys.lists(), context.previousOrders)
      }
      if (context?.previousOrder) {
        queryClient.setQueryData(workOrderKeys.detail(id), context.previousOrder)
      }
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(id) })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteWorkOrder,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: workOrderKeys.lists() })
      const previousOrders = queryClient.getQueryData<WorkOrder[]>(workOrderKeys.lists())
      queryClient.setQueryData<WorkOrder[]>(workOrderKeys.lists(), (old = []) =>
        old.filter((order) => order.id !== id)
      )
      return { previousOrders }
    },
    onError: (_error, _id, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(workOrderKeys.lists(), context.previousOrders)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() })
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) => updateWorkOrderStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: workOrderKeys.lists() })
      await queryClient.cancelQueries({ queryKey: workOrderKeys.detail(id) })
      const previousOrders = queryClient.getQueryData<WorkOrder[]>(workOrderKeys.lists())
      const previousOrder = queryClient.getQueryData<WorkOrder>(workOrderKeys.detail(id))
      const optimisticOrder: WorkOrder = {
        ...(previousOrder || (previousOrders?.find((o) => o.id === id) as WorkOrder)),
        status,
      }
      queryClient.setQueryData<WorkOrder[]>(workOrderKeys.lists(), (old = []) =>
        old.map((order) => (order.id === id ? optimisticOrder : order))
      )
      queryClient.setQueryData(workOrderKeys.detail(id), optimisticOrder)
      return { previousOrders, previousOrder }
    },
    onError: (_error, { id }, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(workOrderKeys.lists(), context.previousOrders)
      }
      if (context?.previousOrder) {
        queryClient.setQueryData(workOrderKeys.detail(id), context.previousOrder)
      }
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(id) })
    },
  })

  const updatePriorityMutation = useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: Priority }) =>
      updateWorkOrderPriority(id, priority),
    onMutate: async ({ id, priority }) => {
      await queryClient.cancelQueries({ queryKey: workOrderKeys.lists() })
      await queryClient.cancelQueries({ queryKey: workOrderKeys.detail(id) })
      const previousOrders = queryClient.getQueryData<WorkOrder[]>(workOrderKeys.lists())
      const previousOrder = queryClient.getQueryData<WorkOrder>(workOrderKeys.detail(id))
      const optimisticOrder: WorkOrder = {
        ...(previousOrder || (previousOrders?.find((o) => o.id === id) as WorkOrder)),
        priority,
      }
      queryClient.setQueryData<WorkOrder[]>(workOrderKeys.lists(), (old = []) =>
        old.map((order) => (order.id === id ? optimisticOrder : order))
      )
      queryClient.setQueryData(workOrderKeys.detail(id), optimisticOrder)
      return { previousOrders, previousOrder }
    },
    onError: (_error, { id }, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(workOrderKeys.lists(), context.previousOrders)
      }
      if (context?.previousOrder) {
        queryClient.setQueryData(workOrderKeys.detail(id), context.previousOrder)
      }
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(id) })
    },
  })

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const original = await fetchWorkOrderById(id)
      const duplicateData: WorkOrderFormData = {
        company_name: original.company_name,
        po_number: `${original.po_number} (Copia)`,
        part_name: original.part_name,
        quantity_total: original.quantity_total,
        quantity_completed: 0,
        priority: original.priority,
        status: 'scheduled' as Status,
        created_at: new Date().toISOString(),
      }
      return createWorkOrder(duplicateData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() })
    },
  })

  const createOrder = async (orderData: WorkOrderFormData) => {
    const validation = validateWorkOrderFormData(orderData)
    if (!validation.valid || !validation.sanitized) {
      return { success: false, error: Object.values(validation.errors).join(', ') }
    }
    try {
      await createMutation.mutateAsync(validation.sanitized)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : ERROR_MESSAGES.CREATE_FAILED }
    }
  }

  const updateOrder = async (id: string, orderData: WorkOrderFormData) => {
    if (!validateWorkOrderId(id)) return { success: false, error: 'ID de orden inválido' }
    const validation = validateWorkOrderFormData(orderData)
    if (!validation.valid || !validation.sanitized) {
      return { success: false, error: Object.values(validation.errors).join(', ') }
    }
    try {
      await updateMutation.mutateAsync({ id, data: validation.sanitized })
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : ERROR_MESSAGES.UPDATE_FAILED }
    }
  }

  const deleteOrder = async (id: string) => {
    if (!validateWorkOrderId(id)) return { success: false, error: 'ID de orden inválido' }
    try {
      await deleteMutation.mutateAsync(id)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : ERROR_MESSAGES.DELETE_FAILED }
    }
  }

  const quickUpdateStatus = async (id: string, status: Status) => {
    if (!validateWorkOrderId(id)) return { success: false, error: 'ID de orden inválido' }
    const sanitizedStatus = sanitizeEnum(status, VALID_STATUSES, 'scheduled' as Status)
    if (sanitizedStatus !== status) return { success: false, error: 'Estado inválido' }
    try {
      await updateStatusMutation.mutateAsync({ id, status })
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : ERROR_MESSAGES.UPDATE_FAILED }
    }
  }

  const quickUpdatePriority = async (id: string, priority: Priority) => {
    try {
      await updatePriorityMutation.mutateAsync({ id, priority })
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : ERROR_MESSAGES.UPDATE_FAILED }
    }
  }

  const duplicateOrder = async (id: string) => {
    if (!validateWorkOrderId(id)) return { success: false, error: 'ID de orden inválido' }
    try {
      await duplicateMutation.mutateAsync(id)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : ERROR_MESSAGES.CREATE_FAILED }
    }
  }

  const loading =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    updateStatusMutation.isPending ||
    updatePriorityMutation.isPending ||
    duplicateMutation.isPending

  const error =
    createMutation.error instanceof Error
      ? createMutation.error.message
      : updateMutation.error instanceof Error
        ? updateMutation.error.message
        : deleteMutation.error instanceof Error
          ? deleteMutation.error.message
          : updateStatusMutation.error instanceof Error
            ? updateStatusMutation.error.message
            : updatePriorityMutation.error instanceof Error
              ? updatePriorityMutation.error.message
              : duplicateMutation.error instanceof Error
                ? duplicateMutation.error.message
                : null

  const success = null

  const clearMessages = () => {}

  return {
    createOrder,
    updateOrder,
    deleteOrder,
    quickUpdateStatus,
    quickUpdatePriority,
    duplicateOrder,
    loading,
    error,
    success,
    clearMessages,
  }
}
