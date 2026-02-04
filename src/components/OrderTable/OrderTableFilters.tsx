import { memo, ChangeEvent } from 'react'
import { Search, Filter, Download } from 'lucide-react'
import type { Priority, Status } from '../../types'
import { PRIORITY_LABELS, STATUS_LABELS } from './types'

interface OrderTableFiltersProps {
  searchTerm: string
  searchInputRef: React.RefObject<HTMLInputElement>
  onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void
  filterCompany: string
  filterStatus: string
  filterPriority: string
  companies: string[]
  onCompanyChange: (value: string) => void
  onStatusChange: (value: Status | '') => void
  onPriorityChange: (value: Priority | '') => void
  onAdvancedFiltersClick: () => void
  onExportClick: () => void
  hasAdvancedFilters: boolean
  filteredCount: number
  totalCount: number
  currentPage: number
  itemsPerPage: number
}

export const OrderTableFilters = memo(function OrderTableFilters({
  searchTerm,
  searchInputRef,
  onSearchChange,
  filterCompany,
  filterStatus,
  filterPriority,
  companies,
  onCompanyChange,
  onStatusChange,
  onPriorityChange,
  onAdvancedFiltersClick,
  onExportClick,
  hasAdvancedFilters,
  filteredCount,
  totalCount,
  currentPage,
  itemsPerPage,
}: OrderTableFiltersProps) {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar por PO, pieza o compañía... (Ctrl/Cmd+K)"
            value={searchTerm}
            onChange={onSearchChange}
            className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/15 focus:border-blue-500/50 transition-all duration-200"
            aria-label="Buscar órdenes"
          />
        </div>
        <button
          onClick={onAdvancedFiltersClick}
          className={`flex items-center gap-2 px-4 py-3 text-white font-medium rounded-xl transition-all duration-200 border ${
            hasAdvancedFilters 
              ? 'bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/30' 
              : 'bg-white/10 hover:bg-white/15 border-white/10 hover:border-white/20'
          }`}
          title="Filtros avanzados"
          aria-label="Abrir filtros avanzados"
        >
          <Filter className="w-5 h-5" />
          Filtros Avanzados
          {hasAdvancedFilters && <span className="ml-1 w-2 h-2 bg-purple-400 rounded-full" />}
        </button>
        <button
          onClick={onExportClick}
          className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl transition-all duration-200 border border-white/10 hover:border-white/20"
          title="Exportar órdenes a CSV"
          aria-label="Exportar órdenes a CSV"
        >
          <Download className="w-5 h-5" />
          Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Compañía</label>
          <select
            value={filterCompany}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => onCompanyChange(e.target.value)}
            className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/15 focus:border-blue-500/50 transition-all duration-200"
          >
            <option value="">Todas</option>
            {companies.map((company) => (
              <option key={company} value={company} className="bg-slate-800">
                {company}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Estado</label>
          <select
            value={filterStatus}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => onStatusChange(e.target.value as Status | '')}
            className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/15 focus:border-blue-500/50 transition-all duration-200"
          >
            <option value="">Todos</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value} className="bg-slate-800">
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Prioridad</label>
          <select
            value={filterPriority}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => onPriorityChange(e.target.value as Priority | '')}
            className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/15 focus:border-blue-500/50 transition-all duration-200"
          >
            <option value="">Todas</option>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value} className="bg-slate-800">
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-sm text-gray-400 font-medium">
        Mostrando {filteredCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredCount)} de {filteredCount} órdenes
        {filteredCount !== totalCount && <span className="text-gray-500"> (filtradas de {totalCount} totales)</span>}
      </div>
    </div>
  )
})
