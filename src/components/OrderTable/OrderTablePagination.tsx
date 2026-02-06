import { memo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface OrderTablePaginationProps {
  currentPage: number
  totalPages: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
}

export const OrderTablePagination = memo(function OrderTablePagination({
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}: OrderTablePaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <label className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Items por página:</label>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
        >
          <option value="10" className="bg-white dark:bg-zinc-800">10</option>
          <option value="25" className="bg-white dark:bg-zinc-800">25</option>
          <option value="50" className="bg-white dark:bg-zinc-800">50</option>
          <option value="100" className="bg-white dark:bg-zinc-800">100</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:bg-zinc-50 dark:disabled:bg-zinc-900 disabled:opacity-50 text-zinc-700 dark:text-zinc-300 rounded-xl transition-all duration-200 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 disabled:border-transparent"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm text-zinc-700 dark:text-zinc-300 px-4 font-medium">
          Página {currentPage} de {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:bg-zinc-50 dark:disabled:bg-zinc-900 disabled:opacity-50 text-zinc-700 dark:text-zinc-300 rounded-xl transition-all duration-200 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 disabled:border-transparent"
          aria-label="Página siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
})
