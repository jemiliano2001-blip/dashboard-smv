import { useQuery } from '@tanstack/react-query'
import { fetchWorkOrderById } from '@/features/orders/api/workOrders'
import { workOrderKeys } from '@/features/orders/api/queryKeys'

/**
 * Fetches a single work order by ID.
 * Returns undefined while loading, the order on success, or throws on error.
 */
export function useWorkOrderByIdQuery(id: string | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: workOrderKeys.detail(id ?? ''),
    queryFn: () => fetchWorkOrderById(id!),
    enabled: Boolean(id) && (options?.enabled ?? true),
  })
}
