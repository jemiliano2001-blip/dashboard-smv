import { useMemo } from 'react'
import { Grid3x3 } from 'lucide-react'
import type { GridBreakpoints, WorkOrder } from '../types'
import { getGridCapacity } from '../utils/gridUtils'
import { formatCapacityStatus } from '../utils/formatUtils'

interface GridPreviewProps {
  columns: GridBreakpoints
  rows: GridBreakpoints
  ordersPerPage: number
  breakpoint?: 'default' | 'lg' | 'xl' | '2xl'
  dynamicGridEnabled?: boolean
}

const mockOrder: WorkOrder = {
  id: 'preview',
  company_name: 'Ejemplo',
  po_number: 'PO-123',
  part_name: 'Pieza',
  quantity_total: 100,
  quantity_completed: 50,
  priority: 'normal',
  status: 'production',
  created_at: new Date().toISOString(),
}

export function GridPreview({
  columns,
  rows,
  ordersPerPage,
  breakpoint = 'default',
  dynamicGridEnabled = true,
}: GridPreviewProps) {
  const currentColumns = columns[breakpoint]
  const currentRows = dynamicGridEnabled ? Math.min(rows[breakpoint], 4) : rows[breakpoint]
  const capacity = getGridCapacity(columns, rows, breakpoint)
  const capacityStatus = formatCapacityStatus(currentColumns, currentRows, ordersPerPage)

  const gridItems = useMemo(() => {
    const total = currentColumns * currentRows
    return Array.from({ length: Math.min(total, 12) }, (_, i) => i)
  }, [currentColumns, currentRows])

  const statusColors = {
    sufficient: 'bg-green-500/20 text-green-400 border-green-500/50',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    insufficient: 'bg-red-500/20 text-red-400 border-red-500/50',
  }

  const statusIcons = {
    sufficient: '✓',
    warning: '⚠',
    insufficient: '✗',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid3x3 className="w-5 h-5 text-gray-400" />
          <h3 className="text-sm font-bold text-gray-300">Vista Previa del Grid</h3>
        </div>
        <div
          className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-2 ${statusColors[capacityStatus.status]}`}
        >
          <span>{statusIcons[capacityStatus.status]}</span>
          <span>{capacityStatus.text}</span>
        </div>
      </div>

      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${currentColumns}, minmax(0, 1fr))`,
            gridTemplateRows: dynamicGridEnabled ? 'auto' : `repeat(${currentRows}, minmax(60px, 1fr))`,
          }}
        >
          {gridItems.map((i) => (
            <div
              key={i}
              className="bg-slate-700/50 border border-slate-600 rounded p-2 flex flex-col items-center justify-center min-h-[60px]"
            >
              <div className="text-[10px] text-gray-500 font-mono">{mockOrder.po_number}</div>
              <div className="text-[8px] text-gray-600 mt-1">{mockOrder.part_name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-400 space-y-1">
        <div className="flex justify-between">
          <span>Columnas:</span>
          <span className="text-gray-300 font-medium">{currentColumns}</span>
        </div>
        <div className="flex justify-between">
          <span>Filas:</span>
          <span className="text-gray-300 font-medium">
            {dynamicGridEnabled ? `${currentRows}+ (dinámico)` : currentRows}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Capacidad:</span>
          <span className="text-gray-300 font-medium">{capacity} tarjetas</span>
        </div>
        <div className="flex justify-between">
          <span>Órdenes por página:</span>
          <span className="text-gray-300 font-medium">{ordersPerPage}</span>
        </div>
      </div>
    </div>
  )
}
