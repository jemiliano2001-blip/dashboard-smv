import { useState, useEffect } from 'react'
import { History, Calendar, Filter, X } from 'lucide-react'
import { useOrderHistory } from '../hooks/useOrderHistory'
import { Modal } from './Modal'
import { formatDate } from '../utils/dateFormatter'
import type { WorkOrderHistory, ChangeType } from '../types/history'
import type { WorkOrder } from '../types'

interface OrderHistoryProps {
  order: WorkOrder
  isOpen: boolean
  onClose: () => void
}

const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  create: 'Creación',
  update: 'Actualización',
  delete: 'Eliminación',
}

const FIELD_LABELS: Record<string, string> = {
  company_name: 'Compañía',
  po_number: 'Número PO',
  part_name: 'Nombre Pieza',
  quantity_total: 'Cantidad Total',
  quantity_completed: 'Cantidad Completada',
  priority: 'Prioridad',
  status: 'Estado',
  created: 'Creada',
  deleted: 'Eliminada',
}

export function OrderHistory({ order, isOpen, onClose }: OrderHistoryProps) {
  const { history, loading, error, fetchHistory } = useOrderHistory()
  const [filters, setFilters] = useState<{
    startDate: string
    endDate: string
    changeType: ChangeType | ''
    changedField: string
  }>({
    startDate: '',
    endDate: '',
    changeType: '',
    changedField: '',
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (isOpen && order.id) {
      fetchHistory(order.id, {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        changeType: filters.changeType || undefined,
        changedField: filters.changedField || undefined,
      })
    }
  }, [isOpen, order.id, filters])

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      changeType: '',
      changedField: '',
    })
  }

  const hasActiveFilters = filters.startDate || filters.endDate || filters.changeType || filters.changedField

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Historial de Cambios" size="lg">
      <div className="flex flex-col h-[600px]">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-gray-400">
                Orden: <span className="text-white font-semibold">{order.po_number}</span>
              </p>
              <p className="text-sm text-gray-400">
                Compañía: <span className="text-white font-semibold">{order.company_name}</span>
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
            >
              <Filter className="w-4 h-4" />
              Filtros
              {hasActiveFilters && (
                <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  !
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Desde</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Hasta</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Tipo de Cambio</label>
                  <select
                    value={filters.changeType}
                    onChange={(e) => setFilters((prev) => ({ ...prev, changeType: e.target.value as ChangeType | '' }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos</option>
                    <option value="create">Creación</option>
                    <option value="update">Actualización</option>
                    <option value="delete">Eliminación</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Campo</label>
                  <select
                    value={filters.changedField}
                    onChange={(e) => setFilters((prev) => ({ ...prev, changedField: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos</option>
                    <option value="company_name">Compañía</option>
                    <option value="po_number">Número PO</option>
                    <option value="part_name">Nombre Pieza</option>
                    <option value="quantity_total">Cantidad Total</option>
                    <option value="quantity_completed">Cantidad Completada</option>
                    <option value="priority">Prioridad</option>
                    <option value="status">Estado</option>
                  </select>
                </div>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-3 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <History className="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
              <p>Cargando historial...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-red-400">
            <p>Error: {error}</p>
          </div>
        ) : history.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay historial disponible</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      item.change_type === 'create'
                        ? 'bg-green-500/20 text-green-400'
                        : item.change_type === 'update'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {CHANGE_TYPE_LABELS[item.change_type]}
                    </span>
                    <span className="text-sm text-gray-400">
                      {FIELD_LABELS[item.changed_field] || item.changed_field}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(item.created_at)}
                  </span>
                </div>
                {item.old_value !== null && item.new_value !== null && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <span className="text-xs text-gray-500">Valor anterior:</span>
                      <p className="text-sm text-red-400 line-through">{item.old_value}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Nuevo valor:</span>
                      <p className="text-sm text-green-400">{item.new_value}</p>
                    </div>
                  </div>
                )}
                {item.new_value && item.old_value === null && (
                  <div>
                    <span className="text-xs text-gray-500">Valor:</span>
                    <p className="text-sm text-white">{item.new_value}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
