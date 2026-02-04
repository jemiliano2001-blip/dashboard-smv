import { useState, useMemo, useEffect, useCallback } from 'react'

interface UseOrderTablePaginationProps {
  totalItems: number
  defaultItemsPerPage: number
}

export function useOrderTablePagination({ totalItems, defaultItemsPerPage }: UseOrderTablePaginationProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage)

  useEffect(() => {
    setItemsPerPage(defaultItemsPerPage)
    setCurrentPage(1)
  }, [defaultItemsPerPage])

  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / itemsPerPage)
  }, [totalItems, itemsPerPage])

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return { start, end }
  }, [currentPage, itemsPerPage])

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }, [totalPages])

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }, [])

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    paginatedItems,
    handlePageChange,
    handleItemsPerPageChange,
  }
}
