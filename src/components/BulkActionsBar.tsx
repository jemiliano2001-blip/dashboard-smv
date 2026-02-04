import { useState } from 'react'
import { CheckCircle, X, AlertCircle, MoreHorizontal } from 'lucide-react'
import { useBulkActions } from '../hooks/useBulkActions'
import { Modal } from './Modal'
import { ConfirmDialog } from './ConfirmDialog'
import type { Priority, Status } from '../types'

interface BulkActionsBarProps {
  selectedIds: Set<string>
  onSelectionClear: () => void
  onActionComplete: () => void
}

const STATUS_OPTIONS: Array<{ value: Status; label: string }> = [
  { value: 'scheduled', label: 'Programada' },
  { value: 'production', label: 'En Producción' },
  { value: 'quality', label: 'Calidad' },
  { value: 'hold', label: 'En Hold' },
]

const PRIORITY_OPTIONS: Array<{ value: Priority; label: string }> = [
  { value: 'low', label: 'Baja' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Crítica' },
]

export function BulkActionsBar({
  selectedIds,
  onSelectionClear,
  onActionComplete,
}: BulkActionsBarProps) {
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showPriorityModal, setShowPriorityModal] = useState(false)
  const [showCompanyModal, setShowCompanyModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<Status>('scheduled')
  const [selectedPriority, setSelectedPriority] = useState<Priority>('normal')

  const {
    bulkUpdateStatus,
    bulkUpdatePriority,
    bulkUpdateCompany,
    bulkDelete,
    loading,
  } = useBulkActions()

  const selectedCount = selectedIds.size

  const handleBulkStatusUpdate = async () => {
    const result = await bulkUpdateStatus(Array.from(selectedIds), selectedStatus)
    if (result.success) {
      setShowStatusModal(false)
      onActionComplete()
      onSelectionClear()
    }
  }

  const handleBulkPriorityUpdate = async () => {
    const result = await bulkUpdatePriority(Array.from(selectedIds), selectedPriority)
    if (result.success) {
      setShowPriorityModal(false)
      onActionComplete()
      onSelectionClear()
    }
  }

  const handleBulkCompanyUpdate = async () => {
    if (!companyName.trim()) return
    const result = await bulkUpdateCompany(Array.from(selectedIds), companyName.trim())
    if (result.success) {
      setShowCompanyModal(false)
      setCompanyName('')
      onActionComplete()
      onSelectionClear()
    }
  }

  const handleBulkDelete = async () => {
    const result = await bulkDelete(Array.from(selectedIds))
    if (result.success) {
      setShowDeleteConfirm(false)
      onActionComplete()
      onSelectionClear()
    }
  }

  if (selectedCount === 0) return null

  return (
    <>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-slate-800 border-2 border-blue-500 rounded-lg shadow-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 rounded-lg">
            <CheckCircle className="w-5 h-5 text-blue-400" />
            <span className="text-white font-bold">
              {selectedCount} {selectedCount === 1 ? 'orden seleccionada' : 'órdenes seleccionadas'}
            </span>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-700 pl-3">
            <button
              onClick={() => setShowStatusModal(true)}
              disabled={loading}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white text-sm font-bold rounded-lg transition-colors"
              title="Cambiar estado"
            >
              Estado
            </button>

            <button
              onClick={() => setShowPriorityModal(true)}
              disabled={loading}
              className="px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-600 text-white text-sm font-bold rounded-lg transition-colors"
              title="Cambiar prioridad"
            >
              Prioridad
            </button>

            <button
              onClick={() => setShowCompanyModal(true)}
              disabled={loading}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white text-sm font-bold rounded-lg transition-colors"
              title="Cambiar compañía"
            >
              Compañía
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white text-sm font-bold rounded-lg transition-colors"
              title="Eliminar seleccionadas"
            >
              Eliminar
            </button>

            <button
              onClick={onSelectionClear}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Limpiar selección"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Cambiar Estado"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Cambiar el estado de {selectedCount} {selectedCount === 1 ? 'orden' : 'órdenes'} a:
          </p>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as Status)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowStatusModal(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleBulkStatusUpdate}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold rounded-lg transition-colors"
            >
              {loading ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showPriorityModal}
        onClose={() => setShowPriorityModal(false)}
        title="Cambiar Prioridad"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Cambiar la prioridad de {selectedCount} {selectedCount === 1 ? 'orden' : 'órdenes'} a:
          </p>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value as Priority)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowPriorityModal(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleBulkPriorityUpdate}
              disabled={loading}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-600 text-white font-bold rounded-lg transition-colors"
            >
              {loading ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showCompanyModal}
        onClose={() => {
          setShowCompanyModal(false)
          setCompanyName('')
        }}
        title="Cambiar Compañía"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Cambiar la compañía de {selectedCount} {selectedCount === 1 ? 'orden' : 'órdenes'} a:
          </p>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Nombre de la compañía"
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowCompanyModal(false)
                setCompanyName('')
              }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleBulkCompanyUpdate}
              disabled={loading || !companyName.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
            >
              {loading ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Eliminar Órdenes"
        message={`¿Estás seguro de que deseas eliminar ${selectedCount} ${selectedCount === 1 ? 'orden' : 'órdenes'}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </>
  )
}
