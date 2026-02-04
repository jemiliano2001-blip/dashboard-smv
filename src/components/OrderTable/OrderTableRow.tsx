import { memo, ChangeEvent } from 'react'
import { Edit, Trash2, MoreVertical } from 'lucide-react'
import { formatDate } from '../../utils/dateFormatter'
import { formatPoForDisplay } from '../../utils/formatUtils'
import { PRIORITY_COLORS } from '../../utils/constants'
import type { WorkOrder, Status, Priority } from '../../types'
import { PRIORITY_LABELS, STATUS_LABELS } from './types'

interface OrderTableRowProps {
  order: WorkOrder
  isSelected: boolean
  searchTerm: string
  bulkOperationsEnabled: boolean
  quickActionsEnabled: boolean
  loading: boolean
  onSelect: (orderId: string, checked: boolean) => void
  onEdit: (order: WorkOrder) => void
  onDelete: (id: string) => void
  onQuickMenu: (order: WorkOrder, position: { x: number; y: number }) => void
  highlightText: (text: string, searchTerm: string) => JSX.Element
}

export const OrderTableRow = memo(function OrderTableRow({
  order,
  isSelected,
  searchTerm,
  bulkOperationsEnabled,
  quickActionsEnabled,
  loading,
  onSelect,
  onEdit,
  onDelete,
  onQuickMenu,
  highlightText,
}: OrderTableRowProps) {
  const progress = order.quantity_total > 0
    ? Math.round((order.quantity_completed / order.quantity_total) * 100)
    : 0
  const priorityClass = PRIORITY_COLORS[order.priority] || PRIORITY_COLORS.normal

  return (
    <tr
      className={`group border-b border-white/5 hover:bg-white/5 transition-all duration-200 ${isSelected ? 'bg-blue-500/10' : ''}`}
      onContextMenu={(e) => {
        if (quickActionsEnabled) {
          e.preventDefault()
          onQuickMenu(order, { x: e.clientX, y: e.clientY })
        }
      }}
    >
      {bulkOperationsEnabled && (
        <td className="px-6 py-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onSelect(order.id, e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent"
            aria-label={`Seleccionar orden ${order.po_number}`}
          />
        </td>
      )}
      <td className="px-6 py-4 max-w-[220px]" title={order.company_name}>
        <span className="block truncate text-sm font-medium text-white">
          {highlightText(order.company_name, searchTerm)}
        </span>
      </td>
      <td className="px-6 py-4" title={order.po_number}>
        <span className="text-sm text-gray-300">
          {highlightText(formatPoForDisplay(order.po_number), searchTerm)}
        </span>
      </td>
      <td className="px-6 py-4 max-w-[220px]" title={order.part_name}>
        <span className="block truncate text-sm text-gray-300">
          {highlightText(order.part_name, searchTerm)}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-400 whitespace-nowrap">{formatDate(order.created_at)}</span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white/10 rounded-full h-2 min-w-[80px] overflow-hidden">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap font-medium">
            {order.quantity_completed}/{order.quantity_total} ({progress}%)
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-semibold ${priorityClass}`}>
          {PRIORITY_LABELS[order.priority] || order.priority}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm font-medium text-gray-300 whitespace-nowrap">
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          <button
            onClick={() => onEdit(order)}
            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Editar"
            aria-label={`Editar orden ${order.po_number}`}
          >
            <Edit className="w-4 h-4" />
          </button>
          {quickActionsEnabled && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onQuickMenu(order, { x: e.clientX, y: e.clientY })
              }}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Más opciones"
              aria-label={`Más opciones para orden ${order.po_number}`}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onDelete(order.id)}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500"
            title="Eliminar"
            aria-label={`Eliminar orden ${order.po_number}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  )
})
