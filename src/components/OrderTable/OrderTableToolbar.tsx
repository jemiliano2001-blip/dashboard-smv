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
          className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-xl transition-all duration-200 border border-zinc-200 dark:border-zinc-700"
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
        className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-xl transition-all duration-200 border border-zinc-200 dark:border-zinc-700"
        title="Exportar seleccionadas"
      >
        <Download className="w-4 h-4" />
        Exportar {selectedCount}
      </button>
      <button
        onClick={onBulkDelete}
        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl transition-all duration-200 border border-red-500/30 dark:border-red-500/30"
        aria-label={`Eliminar ${selectedCount} órdenes seleccionadas`}
      >
        <Trash className="w-4 h-4" />
        Eliminar {selectedCount}
      </button>
      <button
        onClick={onColumnManagerClick}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-xl transition-all duration-200 border border-zinc-200 dark:border-zinc-700"
        title="Gestionar columnas"
      >
        <Settings className="w-4 h-4" />
        Columnas
      </button>
    </div>
  )
})
