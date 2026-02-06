import type { ColumnDef } from '@tanstack/react-table'
import { Edit, Trash2, MoreVertical } from 'lucide-react'
import { formatDate } from '@/utils/dateFormatter'
import { formatPoForDisplay } from '@/utils/formatUtils'
import { PRIORITY_COLORS, STATUS_COLORS } from '@/utils/constants'
import { PRIORITY_LABELS, STATUS_LABELS } from './types'
import type { WorkOrder, Priority, Status } from '@/types'

function highlightText(text: string, searchTerm: string): React.ReactNode {
  if (!searchTerm || !text) return text
  const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === searchTerm.toLowerCase() ? (
      <mark key={i} className="bg-yellow-400 text-yellow-900 px-1 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  )
}

export interface OrderTableCallbacks {
  onEdit: (order: WorkOrder) => void
  onDelete: (id: string) => void
  onQuickMenu: (order: WorkOrder, position: { x: number; y: number }) => void
  onDuplicate?: (order: WorkOrder) => void
  onQuickStatusChange?: (id: string, status: Status) => void
  onQuickPriorityChange?: (id: string, priority: Priority) => void
}

export function createColumns(
  callbacks: OrderTableCallbacks,
  options: {
    bulkOperationsEnabled: boolean
    quickActionsEnabled: boolean
    loading: boolean
    searchTerm: string
    density?: 'compact' | 'comfortable'
  }
): ColumnDef<WorkOrder>[] {
  const { bulkOperationsEnabled, quickActionsEnabled, loading, searchTerm, density = 'compact' } = options
  const rowPadding = density === 'compact' ? 'py-2' : 'py-4'

  const cols: ColumnDef<WorkOrder>[] = []

  if (bulkOperationsEnabled) {
    cols.push({
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          ref={(el) => {
            if (el) el.indeterminate = table.getIsSomePageRowsSelected()
          }}
          onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
          className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
          aria-label="Seleccionar todas"
        />
      ),
      cell: ({ row }) => (
        <div className={`px-6 ${rowPadding}`}>
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={(e) => row.toggleSelected(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
            aria-label={`Seleccionar ${row.original.po_number}`}
          />
        </div>
      ),
      size: 48,
      enableSorting: false,
    })
  }

  cols.push(
    {
      id: 'company_name',
      accessorKey: 'company_name',
      header: 'Compañía',
      cell: ({ getValue }) => (
        <div className={`px-6 ${rowPadding} max-w-[220px]`} title={String(getValue() ?? '')}>
          <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {highlightText(String(getValue() ?? ''), searchTerm)}
          </span>
        </div>
      ),
      filterFn: (row, _columnId, filterValue: string) => {
        if (!filterValue) return true
        return String(row.getValue('company_name')).toLowerCase().includes(filterValue.toLowerCase())
      },
      size: 140,
    },
    {
      id: 'po_number',
      accessorKey: 'po_number',
      header: 'PO Number',
      cell: ({ getValue }) => (
        <div className={`px-6 ${rowPadding}`} title={String(getValue() ?? '')}>
          <span className="text-sm text-zinc-600 dark:text-zinc-300 font-mono">
            {highlightText(formatPoForDisplay(String(getValue() ?? '')), searchTerm)}
          </span>
        </div>
      ),
      filterFn: (row, _columnId, filterValue: string) => {
        if (!filterValue) return true
        const val = String(row.getValue('po_number') ?? '')
        return val.toLowerCase().includes(filterValue.toLowerCase())
      },
      size: 100,
    },
    {
      id: 'part_name',
      accessorKey: 'part_name',
      header: 'Pieza',
      cell: ({ getValue }) => (
        <div className={`px-6 ${rowPadding} max-w-[220px]`} title={String(getValue() ?? '')}>
          <span className="block truncate text-sm text-zinc-600 dark:text-zinc-300">
            {highlightText(String(getValue() ?? ''), searchTerm)}
          </span>
        </div>
      ),
      filterFn: (row, _columnId, filterValue: string) => {
        if (!filterValue) return true
        return String(row.getValue('part_name')).toLowerCase().includes(filterValue.toLowerCase())
      },
      size: 180,
    },
    {
      id: 'created_at',
      accessorKey: 'created_at',
      header: 'Fecha',
      cell: ({ getValue }) => (
        <div className={`px-6 ${rowPadding}`}>
          <span className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap font-mono">
            {formatDate(String(getValue() ?? ''))}
          </span>
        </div>
      ),
      sortingFn: 'datetime',
      size: 120,
    },
    {
      id: 'progress',
      header: 'Progreso',
      cell: ({ row }) => {
        const order = row.original
        const progress =
          order.quantity_total > 0
            ? Math.round((order.quantity_completed / order.quantity_total) * 100)
            : 0
        return (
          <div className={`px-6 ${rowPadding}`}>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 min-w-[80px] overflow-hidden">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap font-medium font-mono">
                {order.quantity_completed}/{order.quantity_total} ({progress}%)
              </span>
            </div>
          </div>
        )
      },
      size: 140,
      enableSorting: false,
      enableColumnFilter: false,
    },
    {
      id: 'priority',
      accessorKey: 'priority',
      header: 'Prioridad',
      cell: ({ getValue }) => {
        const priority = getValue() as Priority
        const cls = PRIORITY_COLORS[priority] ?? PRIORITY_COLORS.normal
        return (
          <div className={`px-6 ${rowPadding}`}>
            <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-semibold ${cls}`}>
              {PRIORITY_LABELS[priority] ?? priority}
            </span>
          </div>
        )
      },
      filterFn: (row, _columnId, filterValue: string) => {
        if (!filterValue) return true
        return row.getValue('priority') === filterValue
      },
      size: 100,
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ getValue }) => {
        const status = getValue() as Status
        const cls = STATUS_COLORS[status] ?? STATUS_COLORS.scheduled
        return (
          <div className={`px-6 ${rowPadding}`}>
            <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-semibold ${cls}`}>
              {STATUS_LABELS[status] ?? status}
            </span>
          </div>
        )
      },
      filterFn: (row, _columnId, filterValue: string) => {
        if (!filterValue) return true
        return row.getValue('status') === filterValue
      },
      size: 110,
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const order = row.original
        return (
          <div
            className={`px-6 ${rowPadding} group flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap`}
          >
            <button
              onClick={() => callbacks.onEdit(order)}
              className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
              title="Editar"
              aria-label={`Editar ${order.po_number}`}
            >
              <Edit className="w-4 h-4" />
            </button>
            {quickActionsEnabled && (
              <button
                onClick={(e) => callbacks.onQuickMenu(order, { x: e.clientX, y: e.clientY })}
                className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                title="Más opciones"
                aria-label={`Más opciones ${order.po_number}`}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => callbacks.onDelete(order.id)}
              disabled={loading}
              className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
              title="Eliminar"
              aria-label={`Eliminar ${order.po_number}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )
      },
      size: 120,
      enableSorting: false,
      enableColumnFilter: false,
    }
  )

  return cols
}
