import { type ChangeEvent } from 'react'
import { SettingsSection } from './SettingsSection'
import { SettingsField, ValidatedInput, SettingsSlider, SettingsSwitch, SettingsSelector } from './SettingsField'
import { Clock, Tv, Layout, RefreshCw } from 'lucide-react'
import { SETTINGS_LIMITS } from '../utils/constants'
import { formatRotationTime } from '../utils/formatUtils'
import type { DashboardSettings } from '../types'

interface DashboardSettingsTabProps {
  settings: DashboardSettings
  onChange: (settings: DashboardSettings) => void
  hasChanges?: boolean
}

export function DashboardSettingsTab({ settings, onChange, hasChanges = false }: DashboardSettingsTabProps) {
  const handleChange = (key: keyof DashboardSettings, value: number | boolean | string) => {
    onChange({ ...settings, [key]: value })
  }

  return (
    <div className="space-y-4">
      <SettingsSection
        title="Visualización (TV Mode)"
        description="Configura cómo se muestra el dashboard en la pantalla"
        storageKey="dashboard-visualization"
        hasChanges={hasChanges}
        icon={<Tv className="w-5 h-5" />}
      >
        <SettingsSwitch
          label="Modo Pantalla Ajustada (Fit-to-Screen)"
          description="Activado: todas las órdenes en pantalla sin scroll (con muchas órdenes la descripción puede no verse). Desactivado: tamaño mínimo por tarjeta; si hay muchas órdenes aparece scroll y la descripción se ve mejor."
          checked={settings.fitToScreen ?? true}
          onChange={(checked) => handleChange('fitToScreen', checked)}
        />

        <div className="mt-4">
          <SettingsSelector
            label="Densidad de Columnas"
            description="Define cuántas órdenes se muestran horizontalmente"
            value={settings.columnDensity ?? 'auto'}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 4, label: '4' },
              { value: 6, label: '6' },
              { value: 8, label: '8' },
              { value: 10, label: '10' },
            ]}
            onChange={(value) => handleChange('columnDensity', value)}
          />
        </div>

        <div className="mt-4">
          <SettingsSelector
            label="Tamaño de Texto"
            description="Ideal para ajustar la legibilidad según la distancia de la TV"
            value={settings.textSize ?? 'normal'}
            options={[
              { value: 'normal', label: 'Normal' },
              { value: 'large', label: 'Grande' },
              { value: 'extra-large', label: 'Extra Grande' },
            ]}
            onChange={(value) => handleChange('textSize', value)}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Ordenamiento Inteligente"
        description="Controla cómo se organizan las órdenes en el dashboard"
        storageKey="dashboard-sorting"
        hasChanges={hasChanges}
        icon={<Layout className="w-5 h-5" />}
      >
        <SettingsSwitch
          label="Priorizar Órdenes Viejas"
          description="Coloca las fechas más antiguas al principio"
          checked={settings.prioritizeOldOrders ?? false}
          onChange={(checked) => handleChange('prioritizeOldOrders', checked)}
        />

        <SettingsSwitch
          label="Agrupar por Tamaño (Tetris)"
          description="Muestra primero las tarjetas con descripciones cortas para mantener el orden visual arriba, y deja las largas al final"
          checked={settings.groupBySize ?? false}
          onChange={(checked) => handleChange('groupBySize', checked)}
        />
      </SettingsSection>

      <SettingsSection
        title="Sistema"
        description="Configuración del comportamiento del sistema"
        storageKey="dashboard-system"
        hasChanges={hasChanges}
        icon={<RefreshCw className="w-5 h-5" />}
      >
        <SettingsField
          label="Velocidad de Auto-Refresco"
          description="¿Cada cuánto tiempo buscar nuevas órdenes?"
          unit="min"
          value={settings.autoRefreshInterval ?? 5}
        >
          <SettingsSlider
            min={1}
            max={60}
            value={settings.autoRefreshInterval ?? 5}
            onChange={(value) => handleChange('autoRefreshInterval', value)}
            unit=""
          />
        </SettingsField>
      </SettingsSection>

      <SettingsSection
        title="Rotación"
        description="Configuración de rotación entre compañías"
        storageKey="dashboard-rotation"
        hasChanges={hasChanges}
        icon={<Clock className="w-5 h-5" />}
      >
        <SettingsField
          label="Rotación por Compañía"
          description={`Tiempo que se muestra cada compañía antes de cambiar a la siguiente. ${formatRotationTime(settings.companyRotation)}`}
          validationState={
            settings.companyRotation < SETTINGS_LIMITS.COMPANY_ROTATION_MIN ||
            settings.companyRotation > SETTINGS_LIMITS.COMPANY_ROTATION_MAX
              ? 'error'
              : settings.companyRotation < 15
              ? 'warning'
              : 'valid'
          }
          warning={
            settings.companyRotation < 15
              ? 'Rotaciones muy rápidas pueden dificultar la lectura. Se recomienda al menos 15 segundos.'
              : undefined
          }
          unit="seg"
          value={settings.companyRotation}
        >
          <ValidatedInput
            type="number"
            min={SETTINGS_LIMITS.COMPANY_ROTATION_MIN}
            max={SETTINGS_LIMITS.COMPANY_ROTATION_MAX}
            value={settings.companyRotation}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleChange('companyRotation', parseInt(e.target.value) || 30)
            }
            validationState={
              settings.companyRotation < SETTINGS_LIMITS.COMPANY_ROTATION_MIN ||
              settings.companyRotation > SETTINGS_LIMITS.COMPANY_ROTATION_MAX
                ? 'error'
                : settings.companyRotation < 15
                ? 'warning'
                : 'valid'
            }
          />
        </SettingsField>
      </SettingsSection>
    </div>
  )
}
