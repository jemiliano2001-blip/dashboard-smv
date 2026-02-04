import { memo } from 'react'
import type { SortColumn, SortOrder } from './types'

interface OrderTableHeaderProps {
  sortBy: SortColumn
  sortOrder: SortOrder
  onSort: (column: SortColumn) => void
  bulkOperationsEnabled: boolean
  onSelectAll: (checked: boolean) => void
  allSelected: boolean
  someSelected: boolean
}

export const OrderTableHeader = memo(function OrderTableHeader({
  sortBy,
  sortOrder,
  onSort,
  bulkOperationsEnabled,
  onSelectAll,
  allSelected,
  someSelected,
}: OrderTableHeaderProps) {
  return (
    <thead className="sticky top-0 bg-white/10 backdrop-blur-sm z-10 border-b border-white/10">
      <tr>
        {bulkOperationsEnabled && (
          <th className="px-6 py-3 text-left w-12">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(input) => {
                if (input) input.indeterminate = someSelected
              }}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent"
              aria-label="Seleccionar todas las órdenes"
            />
          </th>
        )}
        <th
          className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors duration-200 w-[12%]"
          onClick={() => onSort('company_name')}
        >
          <div className="flex items-center gap-2">
            Compañía
            {sortBy === 'company_name' && (
              <span className="text-blue-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
        </th>
        <th
          className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors duration-200 w-[10%]"
          onClick={() => onSort('po_number')}
        >
          <div className="flex items-center gap-2">
            PO Number
            {sortBy === 'po_number' && (
              <span className="text-blue-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
        </th>
        <th
          className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors duration-200 w-[22%]"
          onClick={() => onSort('part_name')}
        >
          <div className="flex items-center gap-2">
            Pieza
            {sortBy === 'part_name' && (
              <span className="text-blue-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
        </th>
        <th
          className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors duration-200 w-[120px] min-w-[120px]"
          onClick={() => onSort('created_at')}
        >
          <div className="flex items-center gap-2">
            Fecha de Creación
            {sortBy === 'created_at' && (
              <span className="text-blue-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
        </th>
        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-[140px] min-w-[140px]">
          Progreso
        </th>
        <th
          className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors duration-200 w-[100px] min-w-[100px]"
          onClick={() => onSort('priority')}
        >
          <div className="flex items-center gap-2">
            Prioridad
            {sortBy === 'priority' && (
              <span className="text-blue-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
        </th>
        <th
          className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors duration-200 w-[110px] min-w-[110px]"
          onClick={() => onSort('status')}
        >
          <div className="flex items-center gap-2">
            Estado
            {sortBy === 'status' && (
              <span className="text-blue-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
        </th>
        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-[120px] min-w-[120px]">
          Acciones
        </th>
      </tr>
    </thead>
  )
})
