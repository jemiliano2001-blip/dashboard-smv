import { useState, useEffect, useMemo } from 'react'
import { useBeforeUnload } from 'react-router-dom'
import { Save, RotateCcw, Tv, Settings, Palette, Sliders } from 'lucide-react'
import { SettingsTabs } from './SettingsTabs'
import { SettingsSearch } from './SettingsSearch'
import { DashboardSettingsTab } from './DashboardSettingsTab'
import { AdminPanelSettingsTab } from './AdminPanelSettingsTab'
import { AppearanceSettingsTab } from './AppearanceSettingsTab'
import { AdvancedSettingsTab } from './AdvancedSettingsTab'
import { ConfirmDialog } from './ConfirmDialog'
import { ToastContainer } from './Toast'
import { useAppSettings } from '../hooks/useAppSettings'
import { useToast } from '../hooks/useToast'
import { DEFAULT_APP_SETTINGS } from '../types/settings'
import { searchSettings } from '../utils/settingsSearch'
import type { AppSettings } from '../types'

export function SettingsPage() {
  const { settings, saveSettings, loading } = useAppSettings()
  const { success: showSuccess, error: showError, toasts, removeToast } = useToast()
  const [localSettings, setLocalSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS)
  const [hasChanges, setHasChanges] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'dashboard' | 'admin' | 'appearance' | 'advanced'>('dashboard')
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    if (!loading) {
      setLocalSettings(settings)
      setHasChanges(false)
    }
  }, [settings, loading])

  const handleDashboardChange = (dashboardSettings: typeof settings.dashboard) => {
    setLocalSettings((prev) => ({ ...prev, dashboard: dashboardSettings }))
    setHasChanges(true)
  }

  const handleAdminPanelChange = (adminPanelSettings: typeof settings.adminPanel) => {
    setLocalSettings((prev) => ({ ...prev, adminPanel: adminPanelSettings }))
    setHasChanges(true)
  }

  const handleAppearanceChange = (appearanceSettings: typeof settings.appearance) => {
    setLocalSettings((prev) => ({ ...prev, appearance: appearanceSettings }))
    setHasChanges(true)
  }

  const handleAdvancedChange = (newSettings: AppSettings) => {
    setLocalSettings(newSettings)
    setHasChanges(true)
  }

  useBeforeUnload(
    hasChanges
      ? (event) => {
          event.preventDefault()
          // Most browsers ignore custom text, but preventDefault triggers the prompt
        }
      : undefined,
  )

  const handleSave = () => {
    try {
      saveSettings(localSettings)
      setHasChanges(false)
      showSuccess('Configuración guardada exitosamente')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Error al guardar la configuración')
    }
  }

  const handleReset = () => {
    setConfirmReset(true)
  }

  const handleConfirmReset = () => {
    try {
      const backup = {
        ...localSettings,
        backupCreatedAt: new Date().toISOString(),
      }
      localStorage.setItem('settings-backup', JSON.stringify(backup))

      setLocalSettings(DEFAULT_APP_SETTINGS)
      setHasChanges(true)
      setConfirmReset(false)
      showSuccess('Configuración restablecida. Guarda para aplicar los cambios.')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Error al restablecer la configuración')
    }
  }

  const searchResults = useMemo(() => {
    return searchSettings(localSettings, searchQuery)
  }, [localSettings, searchQuery])

  const filteredTabs = useMemo(() => {
    const allTabs = [
      {
        id: 'dashboard' as const,
        label: 'Dashboard',
        icon: Tv,
        content: (
          <DashboardSettingsTab
            settings={localSettings.dashboard}
            onChange={handleDashboardChange}
            hasChanges={hasChanges}
          />
        ),
      },
      {
        id: 'admin' as const,
        label: 'Admin Panel',
        icon: Settings,
        content: (
          <AdminPanelSettingsTab
            settings={localSettings.adminPanel}
            onChange={handleAdminPanelChange}
            hasChanges={hasChanges}
          />
        ),
      },
      {
        id: 'appearance' as const,
        label: 'Apariencia',
        icon: Palette,
        content: (
          <AppearanceSettingsTab
            settings={localSettings.appearance}
            onChange={handleAppearanceChange}
            hasChanges={hasChanges}
          />
        ),
      },
      {
        id: 'advanced' as const,
        label: 'Avanzado',
        icon: Sliders,
        content: (
          <AdvancedSettingsTab
            settings={localSettings}
            onChange={handleAdvancedChange}
            hasChanges={hasChanges}
          />
        ),
      },
    ]

    if (!searchQuery.trim()) {
      return allTabs
    }

    return allTabs.filter((tab) => searchResults.matchingTabs.has(tab.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers are stable in effect
  }, [localSettings, searchQuery, searchResults.matchingTabs, hasChanges])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-zinc-600 dark:text-zinc-400">Cargando configuraciones...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="mb-6">
        <SettingsSearch
          onSearch={setSearchQuery}
          placeholder="Buscar configuración..."
        />
      </div>

      {/* Search Results Info */}
      {searchQuery.trim() && (
        <div className="mb-6 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl backdrop-blur-sm">
          <p className="text-sm text-blue-300 font-medium">
            {searchResults.matchingSettings.length > 0 ? (
              <>
                Encontradas <strong>{searchResults.matchingSettings.length}</strong> configuración(es) en{' '}
                <strong>{searchResults.matchingTabs.size}</strong> sección(es)
              </>
            ) : (
              'No se encontraron configuraciones que coincidan con la búsqueda'
            )}
          </p>
        </div>
      )}

      {/* Tabs */}
      <SettingsTabs
        tabs={filteredTabs}
        defaultTab={activeTab}
        hasChanges={hasChanges}
        onTabChange={(tabId) => setActiveTab(tabId)}
      />

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-6 mt-6 border-t border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          {hasChanges && (
            <span className="px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl font-medium border border-blue-500/20">
              Cambios sin guardar
            </span>
          )}
          {settings.lastModified && (
            <span className="text-zinc-500 dark:text-zinc-400">
              Última modificación: {new Date(settings.lastModified).toLocaleString('es-ES')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 font-semibold rounded-xl transition-all duration-200 border border-zinc-200 dark:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            aria-label="Restablecer configuración a valores por defecto"
          >
            <RotateCcw className="w-4 h-4" />
            Restablecer
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/20 disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            aria-label="Guardar configuración"
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={handleConfirmReset}
        title="Restablecer Configuración"
        message="¿Estás seguro de que deseas restablecer todas las configuraciones a los valores por defecto?"
        confirmText="Restablecer"
        cancelText="Cancelar"
        variant="warning"
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
