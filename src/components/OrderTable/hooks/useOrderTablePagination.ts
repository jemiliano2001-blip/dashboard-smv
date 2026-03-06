import { useState, useMemo, useEffect, useCallback, useRef } from 'react'

interface UseOrderTablePaginationProps {
  totalItems: number
  defaultItemsPerPage: number
}

export function useOrderTablePagination({ totalItems, defaultItemsPerPage }: UseOrderTablePaginationProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage)
  const prevDefaultItemsPerPage = useRef(defaultItemsPerPage)

  useEffect(() => {
    if (prevDefaultItemsPerPage.current !== defaultItemsPerPage) {
      prevDefaultItemsPerPage.current = defaultItemsPerPage
      setItemsPerPage(defaultItemsPerPage)
      setCurrentPage(1)
    }
  }, [defaultItemsPerPage])

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / itemsPerPage))
  }, [totalItems, itemsPerPage])

  // Clamp current page when totalPages shrinks (e.g. after filtering) — uses functional
  // setter to avoid adding currentPage as a dependency and causing cascade renders.
  useEffect(() => {
    setCurrentPage((prev) => (prev > totalPages ? totalPages : prev))
  }, [totalPages])

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return { start, end }
  }, [currentPage, itemsPerPage])

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
