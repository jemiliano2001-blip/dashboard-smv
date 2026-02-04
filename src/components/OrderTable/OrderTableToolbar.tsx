import { memo } from 'react'
import { Download, Trash, Settings } from 'lucide-react'

interface OrderTableToolbarProps {
  bulkOperationsEnabled: boolean
  selectedCount: number
  onExportSelected: () => void
  onBulkDelete: () => void
  onColumnManagerClick: () => void
}

export const OrderTableToolbar = memo(function OrderTableToolbar({
  bulkOperationsEnabled,
  selectedCount,
  onExportSelected,
  onBulkDelete,
  onColumnManagerClick,
}: OrderTableToolbarProps) {
  if (!bulkOperationsEnabled || selectedCount === 0) {
    return (
      <div className="flex items-center justify-end">
        <button
          onClick={onColumnManagerClick}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-xl transition-all duration-200 border border-white/10 hover:border-white/20"
          title="Gestionar columnas"
        >
          <Settings className="w-4 h-4" />
          Columnas
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onExportSelected}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-xl transition-all duration-200 border border-white/10 hover:border-white/20"
        title="Exportar seleccionadas"
      >
        <Download className="w-4 h-4" />
        Exportar {selectedCount}
      </button>
      <button
        onClick={onBulkDelete}
        className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium rounded-xl transition-all duration-200 border border-red-500/20 hover:border-red-500/30"
        aria-label={`Eliminar ${selectedCount} órdenes seleccionadas`}
      >
        <Trash className="w-4 h-4" />
        Eliminar {selectedCount}
      </button>
      <button
        onClick={onColumnManagerClick}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-xl transition-all duration-200 border border-white/10 hover:border-white/20"
        title="Gestionar columnas"
      >
        <Settings className="w-4 h-4" />
        Columnas
      </button>
    </div>
  )
})
