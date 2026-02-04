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
        <label className="text-sm text-gray-400 font-medium">Items por página:</label>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/15 focus:border-blue-500/50 transition-all duration-200"
        >
          <option value="10" className="bg-slate-800">10</option>
          <option value="25" className="bg-slate-800">25</option>
          <option value="50" className="bg-slate-800">50</option>
          <option value="100" className="bg-slate-800">100</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2.5 bg-white/10 hover:bg-white/15 disabled:bg-white/5 disabled:opacity-50 text-white rounded-xl transition-all duration-200 border border-white/10 hover:border-white/20 disabled:border-transparent"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm text-gray-300 px-4 font-medium">
          Página {currentPage} de {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2.5 bg-white/10 hover:bg-white/15 disabled:bg-white/5 disabled:opacity-50 text-white rounded-xl transition-all duration-200 border border-white/10 hover:border-white/20 disabled:border-transparent"
          aria-label="Página siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
})
