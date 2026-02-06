import { useState, ChangeEvent } from 'react'
import { SettingsSection } from './SettingsSection'
import { SettingsPresetManager } from './SettingsPresetManager'
import { SettingsImportExport } from './SettingsImportExport'
import { ConfirmDialog } from './ConfirmDialog'
import { AlertTriangle, RotateCcw, Database } from 'lucide-react'
import type { AppSettings, SettingsPreset } from '../types'

interface AdvancedSettingsTabProps {
  settings: AppSettings
  onChange: (settings: AppSettings) => void
  hasChanges?: boolean
}

export function AdvancedSettingsTab({ 
  settings, 
  onChange, 
  hasChanges = false 
}: AdvancedSettingsTabProps) {
  const [confirmLoadPreset, setConfirmLoadPreset] = useState<SettingsPreset | null>(null)
  const [confirmResetAll, setConfirmResetAll] = useState(false)
  const [confirmClearStorage, setConfirmClearStorage] = useState(false)

  const handleLoadPreset = (preset: SettingsPreset) => {
    setConfirmLoadPreset(preset)
  }

  const handleConfirmLoadPreset = () => {
    if (!confirmLoadPreset) return
    const merged: AppSettings = {
      dashboard: { ...settings.dashboard, ...confirmLoadPreset.settings.dashboard },
      adminPanel: { ...settings.adminPanel, ...confirmLoadPreset.settings.adminPanel },
      appearance: { ...settings.appearance, ...confirmLoadPreset.settings.appearance },
    }
    onChange(merged)
    setConfirmLoadPreset(null)
  }

  const handleImport = (importedSettings: AppSettings) => {
    onChange(importedSettings)
  }

  const handleResetAll = () => {
    setConfirmResetAll(true)
  }

  const handleConfirmResetAll = () => {
    // Create backup before reset
    const backup = {
      ...settings,
      backupCreatedAt: new Date().toISOString(),
    }
    localStorage.setItem('settings-backup', JSON.stringify(backup))

    // Reset to defaults
    const { DEFAULT_APP_SETTINGS } = require('../types/settings')
    onChange(DEFAULT_APP_SETTINGS)

    // Clear localStorage
    localStorage.removeItem('tv-dashboard-settings')
    localStorage.removeItem('settings-presets')
    setConfirmResetAll(false)
  }

  const handleClearStorage = () => {
    setConfirmClearStorage(true)
  }

  const handleConfirmClearStorage = () => {
    localStorage.clear()
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      <SettingsSection
        title="Presets de Configuración"
        description="Guarda y carga configuraciones predefinidas"
        storageKey="advanced-presets"
        icon={<Database className="w-5 h-5" />}
      >
        <SettingsPresetManager
          currentSettings={settings}
          onLoadPreset={handleLoadPreset}
        />
      </SettingsSection>

      <SettingsSection
        title="Exportar/Importar Configuración"
        description="Guarda o restaura tus configuraciones"
        storageKey="advanced-importexport"
        icon={<Database className="w-5 h-5" />}
      >
        <SettingsImportExport
          currentSettings={settings}
          onImport={handleImport}
        />
      </SettingsSection>

      <SettingsSection
        title="Restablecer Configuración"
        description="Restablecer a valores por defecto o limpiar almacenamiento"
        storageKey="advanced-reset"
        hasChanges={hasChanges}
        icon={<RotateCcw className="w-5 h-5" />}
      >
        <div className="space-y-4">
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-yellow-500 mb-1">Acciones Destructivas</p>
                <p className="text-xs text-yellow-400">
                  Estas acciones no se pueden deshacer. Se creará un backup automático antes de restablecer.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleResetAll}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              Restablecer Todas las Configuraciones
            </button>

            <button
              onClick={handleClearStorage}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg transition-colors"
            >
              <AlertTriangle className="w-5 h-5" />
              Limpiar Todo el Almacenamiento Local
            </button>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-4">
            <strong>Nota:</strong> El backup se guarda automáticamente antes de restablecer. 
            Puedes recuperarlo desde la sección de Importar.
          </p>
        </div>
      </SettingsSection>

      <ConfirmDialog
        isOpen={confirmLoadPreset !== null}
        onClose={() => setConfirmLoadPreset(null)}
        onConfirm={handleConfirmLoadPreset}
        title="Cargar Preset"
        message={confirmLoadPreset ? `¿Cargar el preset "${confirmLoadPreset.name}"? Esto sobrescribirá tu configuración actual.` : ''}
        confirmText="Cargar"
        cancelText="Cancelar"
        variant="warning"
      />

      <ConfirmDialog
        isOpen={confirmResetAll}
        onClose={() => setConfirmResetAll(false)}
        onConfirm={handleConfirmResetAll}
        title="Restablecer Todas las Configuraciones"
        message="¿Estás seguro de que deseas restablecer TODAS las configuraciones a los valores por defecto? Esta acción no se puede deshacer."
        confirmText="Restablecer"
        cancelText="Cancelar"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={confirmClearStorage}
        onClose={() => setConfirmClearStorage(false)}
        onConfirm={handleConfirmClearStorage}
        title="Limpiar Almacenamiento Local"
        message="¿Estás seguro de que deseas limpiar todo el almacenamiento local? Esto eliminará todas las configuraciones y presets guardados."
        confirmText="Limpiar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  )
}
