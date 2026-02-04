import { useState, useCallback, useMemo } from 'react'
import type { WorkOrder } from '../../../types'
import type { SortColumn, SortOrder } from '../types'

interface UseOrderTableSortProps {
  orders: WorkOrder[]
  defaultSortColumn: SortColumn
  defaultSortOrder: SortOrder
}

export function useOrderTableSort({ orders, defaultSortColumn, defaultSortOrder }: UseOrderTableSortProps) {
  const [sortBy, setSortBy] = useState<SortColumn>(defaultSortColumn)
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultSortOrder)

  const sortOrders = useCallback((ordersToSort: WorkOrder[]): WorkOrder[] => {
    return [...ordersToSort].sort((a, b) => {
      let aValue: string | number = a[sortBy]
      let bValue: string | number = b[sortBy]

      if (sortBy === 'quantity_total' || sortBy === 'quantity_completed') {
        aValue = parseInt(String(aValue)) || 0
        bValue = parseInt(String(bValue)) || 0
      } else if (sortBy === 'created_at') {
        aValue = aValue ? new Date(aValue as string).getTime() : 0
        bValue = bValue ? new Date(bValue as string).getTime() : 0
      } else {
        aValue = String(aValue || '').toLowerCase()
        bValue = String(bValue || '').toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      }
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
    })
  }, [sortBy, sortOrder])

  const handleSort = useCallback((column: SortColumn) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }, [sortBy, sortOrder])

  const sortedOrders = useMemo(() => {
    return sortOrders(orders)
  }, [orders, sortOrders])

  return {
    sortBy,
    sortOrder,
    handleSort,
    sortedOrders,
  }
}
