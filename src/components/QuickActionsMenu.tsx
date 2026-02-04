import { useState, useEffect, useRef } from 'react'
import { MoreVertical, Copy, Edit, Trash2, ArrowUp, ArrowDown, RotateCw } from 'lucide-react'
import type { WorkOrder, Priority, Status } from '../types'

interface QuickActionsMenuProps {
  order: WorkOrder
  position: { x: number; y: number }
  onClose: () => void
  onEdit: (order: WorkOrder) => void
  onDelete: (id: string) => void
  onDuplicate?: (order: WorkOrder) => void
  onQuickStatusChange?: (id: string, status: Status) => void
  onQuickPriorityChange?: (id: string, priority: Priority) => void
}

const STATUS_TRANSITIONS: Record<Status, Status[]> = {
  scheduled: ['production', 'hold'],
  production: ['quality', 'hold'],
  quality: ['scheduled', 'hold'],
  hold: ['scheduled', 'production'],
}

const PRIORITY_ORDER: Priority[] = ['low', 'normal', 'high', 'critical']

export function QuickActionsMenu({
  order,
  position,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onQuickStatusChange,
  onQuickPriorityChange,
}: QuickActionsMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const currentPriorityIndex = PRIORITY_ORDER.indexOf(order.priority)
  const nextPriority = PRIORITY_ORDER[currentPriorityIndex + 1]
  const prevPriority = PRIORITY_ORDER[currentPriorityIndex - 1]
  const availableStatuses = STATUS_TRANSITIONS[order.status] || []

  const handleStatusChange = (status: Status) => {
    onQuickStatusChange?.(order.id, status)
    onClose()
  }

  const handlePriorityChange = (priority: Priority) => {
    onQuickPriorityChange?.(order.id, priority)
    onClose()
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl py-2 min-w-[200px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-100%, 0)',
      }}
    >
      <button
        onClick={() => {
          onEdit(order)
          onClose()
        }}
        className="w-full flex items-center gap-3 px-4 py-2 text-left text-white hover:bg-slate-700 transition-colors"
      >
        <Edit className="w-4 h-4" />
        Editar
      </button>

      {onDuplicate && (
        <button
          onClick={() => {
            onDuplicate(order)
            onClose()
          }}
          className="w-full flex items-center gap-3 px-4 py-2 text-left text-white hover:bg-slate-700 transition-colors"
        >
          <Copy className="w-4 h-4" />
          Duplicar
        </button>
      )}

      {onQuickStatusChange && availableStatuses.length > 0 && (
        <>
          <div className="h-px bg-slate-700 my-1" />
          <div className="px-4 py-1 text-xs font-bold text-gray-400 uppercase">Cambiar Estado</div>
          {availableStatuses.map((status) => {
            const statusLabels: Record<Status, string> = {
              scheduled: 'Programada',
              production: 'En Producción',
              quality: 'Calidad',
              hold: 'En Hold',
            }
            return (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className="w-full flex items-center gap-3 px-4 py-2 text-left text-white hover:bg-slate-700 transition-colors"
              >
                <RotateCw className="w-4 h-4" />
                {statusLabels[status]}
              </button>
            )
          })}
        </>
      )}

      {onQuickPriorityChange && (
        <>
          <div className="h-px bg-slate-700 my-1" />
          <div className="px-4 py-1 text-xs font-bold text-gray-400 uppercase">Cambiar Prioridad</div>
          {prevPriority && (
            <button
              onClick={() => handlePriorityChange(prevPriority)}
              className="w-full flex items-center gap-3 px-4 py-2 text-left text-white hover:bg-slate-700 transition-colors"
            >
              <ArrowDown className="w-4 h-4" />
              Disminuir ({prevPriority === 'low' ? 'Baja' : prevPriority === 'normal' ? 'Normal' : prevPriority === 'high' ? 'Alta' : 'Crítica'})
            </button>
          )}
          {nextPriority && (
            <button
              onClick={() => handlePriorityChange(nextPriority)}
              className="w-full flex items-center gap-3 px-4 py-2 text-left text-white hover:bg-slate-700 transition-colors"
            >
              <ArrowUp className="w-4 h-4" />
              Aumentar ({nextPriority === 'low' ? 'Baja' : nextPriority === 'normal' ? 'Normal' : nextPriority === 'high' ? 'Alta' : 'Crítica'})
            </button>
          )}
        </>
      )}

      <div className="h-px bg-slate-700 my-1" />
      <button
        onClick={() => {
          onDelete(order.id)
          onClose()
        }}
        className="w-full flex items-center gap-3 px-4 py-2 text-left text-red-400 hover:bg-red-500/20 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Eliminar
      </button>
    </div>
  )
}
