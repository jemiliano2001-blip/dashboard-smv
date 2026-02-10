import { useState, type ChangeEvent } from 'react'
import { Filter, X, Save, Calendar } from 'lucide-react'
import { Modal } from './Modal'
import type { Priority, Status } from '../types'

interface FilterPreset {
  id: string
  name: string
  filters: AdvancedFilterState
}

interface AdvancedFilterState {
  searchFields: {
    poNumber: boolean
    partName: boolean
    companyName: boolean
  }
  dateRange: {
    start: string
    end: string
  }
  priority: Priority | ''
  status: Status | ''
  company: string
  combineMode: 'AND' | 'OR'
}

interface AdvancedFiltersProps {
  isOpen: boolean
  onClose: () => void
  onApply: (filters: AdvancedFilterState) => void
  companies: string[]
  currentFilters?: Partial<AdvancedFilterState>
}

const STORAGE_KEY = 'filter-presets'

export function AdvancedFilters({ isOpen, onClose, onApply, companies, currentFilters }: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<AdvancedFilterState>({
    searchFields: {
      poNumber: true,
      partName: true,
      companyName: true,
    },
    dateRange: {
      start: '',
      end: '',
    },
    priority: '',
    status: '',
    company: '',
    combineMode: 'AND',
    ...currentFilters,
  })

  const [presets, setPresets] = useState<FilterPreset[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  })

  const handleFieldToggle = (field: keyof AdvancedFilterState['searchFields']) => {
    setFilters((prev) => ({
      ...prev,
      searchFields: {
        ...prev.searchFields,
        [field]: !prev.searchFields[field],
      },
    }))
  }

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [type]: value,
      },
    }))
  }

  const handleApply = () => {
    onApply(filters)
    onClose()
  }

  const handleSavePreset = () => {
    const name = prompt('Nombre del preset:')
    if (!name) return

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name,
      filters,
    }

    const updatedPresets = [...presets, newPreset]
    setPresets(updatedPresets)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPresets))
  }

  const handleLoadPreset = (preset: FilterPreset) => {
    setFilters(preset.filters)
  }

  const handleDeletePreset = (id: string) => {
    const updatedPresets = presets.filter((p) => p.id !== id)
    setPresets(updatedPresets)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPresets))
  }

  const handleReset = () => {
    setFilters({
      searchFields: {
        poNumber: true,
        partName: true,
        companyName: true,
      },
      dateRange: {
        start: '',
        end: '',
      },
      priority: '',
      status: '',
      company: '',
      combineMode: 'AND',
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filtros Avanzados" size="lg">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Campos de Búsqueda
          </h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.searchFields.poNumber}
                onChange={() => handleFieldToggle('poNumber')}
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 text-blue-600"
              />
              <span className="text-zinc-700 dark:text-zinc-300">Número de PO</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.searchFields.partName}
                onChange={() => handleFieldToggle('partName')}
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 text-blue-600"
              />
              <span className="text-zinc-700 dark:text-zinc-300">Nombre de Pieza</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.searchFields.companyName}
                onChange={() => handleFieldToggle('companyName')}
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 text-blue-600"
              />
              <span className="text-zinc-700 dark:text-zinc-300">Nombre de Compañía</span>
            </label>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Rango de Fechas
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-2">Fecha Inicio</label>
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleDateChange('start', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-2">Fecha Fin</label>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleDateChange('end', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-2">Compañía</label>
            <select
              value={filters.company}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilters((prev) => ({ ...prev, company: e.target.value }))}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              {companies.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-2">Modo de Combinación</label>
            <select
              value={filters.combineMode}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilters((prev) => ({ ...prev, combineMode: e.target.value as 'AND' | 'OR' }))}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="AND">Y (AND)</option>
              <option value="OR">O (OR)</option>
            </select>
          </div>
        </div>

        {presets.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3">Presets Guardados</h3>
            <div className="space-y-2">
              {presets.map((preset) => (
                <div key={preset.id} className="flex items-center justify-between p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                  <button
                    onClick={() => handleLoadPreset(preset)}
                    className="flex-1 text-left text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    {preset.name}
                  </button>
                  <button
                    onClick={() => handleDeletePreset(preset.id)}
                    className="p-1 text-red-400 hover:text-red-300"
                    aria-label="Eliminar preset"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 font-bold rounded-lg transition-colors"
          >
            Restablecer
          </button>
          <button
            onClick={handleSavePreset}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Guardar Preset
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>
    </Modal>
  )
}
