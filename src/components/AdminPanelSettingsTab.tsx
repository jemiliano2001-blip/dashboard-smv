import { type ChangeEvent } from 'react'
import { SettingsSection } from './SettingsSection'
import { SettingsField, ValidatedInput } from './SettingsField'
import { List, RefreshCw, Layers, MousePointerClick, BarChart3 } from 'lucide-react'
import { formatSeconds, secondsToMs, msToSeconds } from '../utils/formatUtils'
import type { AdminPanelSettings, SortColumn, SortOrder } from '../types'

interface AdminPanelSettingsTabProps {
  settings: AdminPanelSettings
  onChange: (settings: AdminPanelSettings) => void
  hasChanges?: boolean
}

const SORT_COLUMN_OPTIONS: Array<{ value: SortColumn; label: string }> = [
  { value: 'company_name', label: 'Compañía' },
  { value: 'po_number', label: 'PO Number' },
  { value: 'part_name', label: 'Pieza' },
  { value: 'created_at', label: 'Fecha de Creación' },
  { value: 'priority', label: 'Prioridad' },
  { value: 'status', label: 'Estado' },
]

const SORT_ORDER_OPTIONS: Array<{ value: SortOrder; label: string }> = [
  { value: 'asc', label: 'Ascendente' },
  { value: 'desc', label: 'Descendente' },
]

export function AdminPanelSettingsTab({ 
  settings, 
  onChange, 
  hasChanges = false 
}: AdminPanelSettingsTabProps) {
  const handleChange = (key: keyof AdminPanelSettings, value: unknown) => {
    onChange({ ...settings, [key]: value })
  }

  return (
    <div className="space-y-4">
      <SettingsSection
        title="Paginación y Ordenamiento"
        description="Configuración por defecto de la tabla de órdenes"
        storageKey="admin-pagination"
        hasChanges={hasChanges}
        icon={<List className="w-5 h-5" />}
      >
        <SettingsField
          label="Items por Página (Por Defecto)"
          description="Número de órdenes mostradas por página cuando se abre el admin panel. Más items = menos páginas pero más tiempo de carga."
          unit="órdenes"
          value={settings.defaultItemsPerPage}
        >
          <select
            value={settings.defaultItemsPerPage}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              handleChange('defaultItemsPerPage', parseInt(e.target.value))
            }
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="10">10 órdenes (rápido)</option>
            <option value="25">25 órdenes (recomendado)</option>
            <option value="50">50 órdenes</option>
            <option value="100">100 órdenes (máximo)</option>
          </select>
        </SettingsField>

        <div className="grid grid-cols-2 gap-4">
          <SettingsField
            label="Columna de Ordenamiento"
            description="Columna por la cual se ordenan las órdenes por defecto"
          >
            <select
              value={settings.defaultSortColumn}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                handleChange('defaultSortColumn', e.target.value as SortColumn)
              }
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SORT_COLUMN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </SettingsField>

          <SettingsField
            label="Orden"
            description="Dirección del ordenamiento (ascendente o descendente)"
          >
            <select
              value={settings.defaultSortOrder}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                handleChange('defaultSortOrder', e.target.value as SortOrder)
              }
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SORT_ORDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </SettingsField>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Actualización Automática"
        description="Configuración de auto-refresh del panel de administración"
        storageKey="admin-autorefresh"
        hasChanges={hasChanges}
        icon={<RefreshCw className="w-5 h-5" />}
      >
        <SettingsField
          label="Intervalo de Auto-Refresh"
          description={`El panel se actualiza automáticamente cada ${formatSeconds(settings.autoRefreshInterval)}. Útil para mantener los datos actualizados sin recargar manualmente.`}
          unit="seg"
          value={Math.round(msToSeconds(settings.autoRefreshInterval))}
          info="Se recomienda un intervalo entre 5-30 segundos para balancear actualización y rendimiento"
        >
          <ValidatedInput
            type="number"
            min="1"
            max="60"
            step="1"
            value={Math.round(msToSeconds(settings.autoRefreshInterval))}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleChange('autoRefreshInterval', secondsToMs(parseInt(e.target.value) || 5))
            }
          />
        </SettingsField>
      </SettingsSection>

      <SettingsSection
        title="Operaciones en Lote"
        description="Habilitar o deshabilitar operaciones masivas"
        storageKey="admin-bulk"
        hasChanges={hasChanges}
        icon={<Layers className="w-5 h-5" />}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label className="block text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-1">
              Habilitar Operaciones en Lote
            </label>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Permite editar, cambiar estado/prioridad o eliminar múltiples órdenes a la vez. Útil para gestionar grandes volúmenes de órdenes eficientemente.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.bulkOperationsEnabled}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange('bulkOperationsEnabled', e.target.checked)
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-200 dark:bg-zinc-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Acciones Rápidas"
        description="Menú contextual y acciones rápidas desde la tabla"
        storageKey="admin-quickactions"
        hasChanges={hasChanges}
        icon={<MousePointerClick className="w-5 h-5" />}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label className="block text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-1">
              Habilitar Acciones Rápidas
            </label>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Menú contextual (click derecho) y botón de acciones rápidas en cada fila. Permite cambiar estado o prioridad sin abrir el formulario completo.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.quickActionsEnabled}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange('quickActionsEnabled', e.target.checked)
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-200 dark:bg-zinc-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Vista de Métricas"
        description="Mostrar métricas por defecto en el admin panel"
        storageKey="admin-metrics"
        hasChanges={hasChanges}
        icon={<BarChart3 className="w-5 h-5" />}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label className="block text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-1">
              Mostrar Métricas por Defecto
            </label>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Mostrar el dashboard de métricas al abrir el admin panel. Proporciona una vista general rápida del estado de todas las órdenes.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showMetricsByDefault}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange('showMetricsByDefault', e.target.checked)
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-200 dark:bg-zinc-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </SettingsSection>
    </div>
  )
}
