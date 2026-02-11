import { useState, useCallback, useMemo, useEffect } from 'react'
import type { WorkOrder, Priority, Status } from '../../../types'
import type { AdvancedFilterState } from '@/features/orders/components/OrderTable/types'

interface UseOrderTableFiltersProps {
  orders: WorkOrder[]
  advancedFilters: AdvancedFilterState | null
}

export function useOrderTableFilters({ orders, advancedFilters }: UseOrderTableFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [filterCompany, setFilterCompany] = useState('')
  const [filterStatus, setFilterStatus] = useState<Status | ''>('')
  const [filterPriority, setFilterPriority] = useState<Priority | ''>('')

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const companies = useMemo(() => {
    const unique = [...new Set(orders.map((o) => o.company_name))]
    return unique.sort()
  }, [orders])

  const matchesSearchTerm = useCallback((order: WorkOrder, searchTerm: string, searchFields?: AdvancedFilterState['searchFields']): boolean => {
    const searchLower = searchTerm.toLowerCase()
    
    if (searchFields) {
      return (
        (searchFields.poNumber && order.po_number?.toLowerCase().includes(searchLower)) ||
        (searchFields.partName && order.part_name?.toLowerCase().includes(searchLower)) ||
        (searchFields.companyName && order.company_name?.toLowerCase().includes(searchLower))
      )
    }
    
    return (
      order.po_number?.toLowerCase().includes(searchLower) ||
      order.part_name?.toLowerCase().includes(searchLower) ||
      order.company_name?.toLowerCase().includes(searchLower)
    )
  }, [])

  const matchesDateRange = useCallback((order: WorkOrder, dateRange?: AdvancedFilterState['dateRange']): boolean => {
    if (!dateRange || (!dateRange.start && !dateRange.end)) {
      return true
    }

    const orderDate = new Date(order.created_at).getTime()
    
    if (dateRange.start) {
      const startDate = new Date(dateRange.start).getTime()
      if (orderDate < startDate) return false
    }
    
    if (dateRange.end) {
      const endDate = new Date(dateRange.end).getTime() + 86400000
      if (orderDate > endDate) return false
    }
    
    return true
  }, [])

  const matchesFilters = useCallback((order: WorkOrder): boolean => {
    const matchesSearch = matchesSearchTerm(order, debouncedSearchTerm, advancedFilters?.searchFields)
    const matchesDate = matchesDateRange(order, advancedFilters?.dateRange)
    
    const companyFilter = advancedFilters?.company || filterCompany
    const matchesCompany = !companyFilter || order.company_name === companyFilter

    const statusFilter = advancedFilters?.status || filterStatus
    const matchesStatus = !statusFilter || order.status === statusFilter

    const priorityFilter = advancedFilters?.priority || filterPriority
    const matchesPriority = !priorityFilter || order.priority === priorityFilter

    if (advancedFilters?.combineMode === 'OR') {
      return matchesSearch || matchesCompany || matchesStatus || matchesPriority || matchesDate
    }
    
    return matchesSearch && matchesCompany && matchesStatus && matchesPriority && matchesDate
  }, [debouncedSearchTerm, filterCompany, filterStatus, filterPriority, advancedFilters, matchesSearchTerm, matchesDateRange])

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    setDebouncedSearchTerm,
    filterCompany,
    setFilterCompany,
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    companies,
    matchesFilters,
  }
}
