import { useState, useEffect } from 'react'
import { Eye, EyeOff, GripVertical, RotateCcw } from 'lucide-react'
import { Modal } from './Modal'

export type ColumnId = 
  | 'checkbox' 
  | 'company_name' 
  | 'po_number' 
  | 'part_name' 
  | 'created_at' 
  | 'progress' 
  | 'priority' 
  | 'status' 
  | 'actions'

export interface ColumnConfig {
  id: ColumnId
  label: string
  visible: boolean
  order: number
  width?: number
}

const STORAGE_KEY = 'admin-table-columns'

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'checkbox', label: '', visible: true, order: 0 },
  { id: 'company_name', label: 'Compañía', visible: true, order: 1 },
  { id: 'po_number', label: 'PO Number', visible: true, order: 2 },
  { id: 'part_name', label: 'Pieza', visible: true, order: 3 },
  { id: 'created_at', label: 'Fecha de Creación', visible: true, order: 4 },
  { id: 'progress', label: 'Progreso', visible: true, order: 5 },
  { id: 'priority', label: 'Prioridad', visible: true, order: 6 },
  { id: 'status', label: 'Estado', visible: true, order: 7 },
  { id: 'actions', label: 'Acciones', visible: true, order: 8 },
]

interface ColumnManagerProps {
  isOpen: boolean
  onClose: () => void
  onColumnsChange: (columns: ColumnConfig[]) => void
}

export function ColumnManager({ isOpen, onClose, onColumnsChange }: ColumnManagerProps) {
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ColumnConfig[]
        setColumns(parsed)
        onColumnsChange(parsed)
      } catch {
        setColumns(DEFAULT_COLUMNS)
        onColumnsChange(DEFAULT_COLUMNS)
      }
    } else {
      onColumnsChange(DEFAULT_COLUMNS)
    }
  }, [onColumnsChange])

  const handleToggleVisibility = (columnId: ColumnId) => {
    if (columnId === 'checkbox' || columnId === 'actions') return

    const updated = columns.map((col) =>
      col.id === columnId ? { ...col, visible: !col.visible } : col
    )
    setColumns(updated)
    onColumnsChange(updated)
    saveColumns(updated)
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null) return

    const newColumns = [...columns]
    const draggedColumn = newColumns[draggedIndex]
    if (!draggedColumn || draggedColumn.id === 'checkbox' || draggedColumn.id === 'actions') return

    newColumns.splice(draggedIndex, 1)
    newColumns.splice(index, 0, draggedColumn)

    const reordered = newColumns.map((col, idx) => ({ ...col, order: idx }))
    setColumns(reordered)
    setDraggedIndex(index)
    onColumnsChange(reordered)
  }

  const handleDragEnd = () => {
    if (draggedIndex !== null) {
      saveColumns(columns)
    }
    setDraggedIndex(null)
  }

  const handleReset = () => {
    setColumns(DEFAULT_COLUMNS)
    onColumnsChange(DEFAULT_COLUMNS)
    localStorage.removeItem(STORAGE_KEY)
  }

  const saveColumns = (cols: ColumnConfig[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cols))
  }

  const visibleColumns = columns.filter((col) => col.visible || col.id === 'checkbox' || col.id === 'actions')

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestionar Columnas" size="md">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Arrastra para reordenar o haz clic en el icono de ojo para mostrar/ocultar columnas
          </p>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg transition-colors"
            title="Restablecer a valores por defecto"
          >
            <RotateCcw className="w-4 h-4" />
            Restablecer
          </button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {columns
            .filter((col) => col.id !== 'checkbox' && col.id !== 'actions')
            .map((column) => {
              const isDraggable = column.id !== 'checkbox' && column.id !== 'actions'
              return (
                <div
                  key={column.id}
                  draggable={isDraggable}
                  onDragStart={() => handleDragStart(columns.indexOf(column))}
                  onDragOver={(e) => handleDragOver(e, columns.indexOf(column))}
                  onDragEnd={handleDragEnd}
                  className={`
                    flex items-center gap-3 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg cursor-move
                    transition-all hover:bg-zinc-200 dark:hover:bg-zinc-700
                    ${draggedIndex === columns.indexOf(column) ? 'opacity-50' : ''}
                  `}
                >
                  <GripVertical className="w-5 h-5 text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
                  <span className="flex-1 text-zinc-900 dark:text-zinc-100 font-medium">{column.label}</span>
                  <button
                    onClick={() => handleToggleVisibility(column.id)}
                    className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded transition-colors"
                    title={column.visible ? 'Ocultar columna' : 'Mostrar columna'}
                  >
                    {column.visible ? (
                      <Eye className="w-5 h-5" />
                    ) : (
                      <EyeOff className="w-5 h-5" />
                    )}
                  </button>
                </div>
              )
            })}
        </div>

        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Mostrando {visibleColumns.length} de {columns.length} columnas
          </p>
        </div>
      </div>
    </Modal>
  )
}
