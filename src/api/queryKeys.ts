/**
 * Query keys for React Query
 * Centralized keys for consistent cache management
 */

export const workOrderKeys = {
  all: ['workOrders'] as const,
  lists: () => [...workOrderKeys.all, 'list'] as const,
  list: (filters?: string) => [...workOrderKeys.lists(), { filters }] as const,
  details: () => [...workOrderKeys.all, 'detail'] as const,
  detail: (id: string) => [...workOrderKeys.details(), id] as const,
}
