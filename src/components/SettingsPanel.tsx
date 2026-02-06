import { useState, useEffect, useMemo } from 'react'
import { Save, RotateCcw, Tv, Settings, Palette, Sliders } from 'lucide-react'
import { Modal } from './Modal'
import { ConfirmDialog } from './ConfirmDialog'
import { SettingsTabs } from './SettingsTabs'
import { SettingsSearch } from './SettingsSearch'
import { DashboardSettingsTab } from './DashboardSettingsTab'
import { AdminPanelSettingsTab } from './AdminPanelSettingsTab'
import { AppearanceSettingsTab } from './AppearanceSettingsTab'
import { AdvancedSettingsTab } from './AdvancedSettingsTab'
import { useAppSettings } from '../hooks/useAppSettings'
import { DEFAULT_APP_SETTINGS } from '../types/settings'
import { searchSettings } from '../utils/settingsSearch'
import type { AppSettings } from '../types'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { settings, saveSettings, loading } = useAppSettings()
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

  const handleSave = () => {
    saveSettings(localSettings)
    setHasChanges(false)
    window.dispatchEvent(new CustomEvent('settings-changed', { detail: localSettings }))
    onClose()
  }

  const handleReset = () => {
    setConfirmReset(true)
  }

  const handleConfirmReset = () => {
    const backup = {
      ...localSettings,
      backupCreatedAt: new Date().toISOString(),
    }
    localStorage.setItem('settings-backup', JSON.stringify(backup))

    setLocalSettings(DEFAULT_APP_SETTINGS)
    setHasChanges(true)
    setConfirmReset(false)
  }

  const searchResults = useMemo(() => {
    return searchSettings(localSettings, searchQuery)
  }, [localSettings, searchQuery])

  const filteredTabs = useMemo(() => {
    if (!searchQuery.trim()) {
      return [
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
    }

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

    return allTabs.filter((tab) => searchResults.matchingTabs.has(tab.id))
  }, [localSettings, searchQuery, searchResults.matchingTabs, hasChanges])

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Configuración" size="xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-zinc-500 dark:text-zinc-400">Cargando configuraciones...</div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configuración" size="xl">
      <div className="flex flex-col h-[calc(90vh-120px)]">
        {/* Search Bar */}
        <SettingsSearch
          onSearch={setSearchQuery}
          placeholder="Buscar configuración..."
        />

        {/* Search Results Info */}
        {searchQuery.trim() && (
          <div className="mb-4 px-4 py-2 bg-blue-600/20 border border-blue-600/50 rounded-lg">
            <p className="text-sm text-blue-300">
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
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            {hasChanges && (
              <span className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded">
                Cambios sin guardar
              </span>
            )}
            {settings.lastModified && (
              <span>
                Última modificación: {new Date(settings.lastModified).toLocaleString('es-ES')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 font-bold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Restablecer configuración a valores por defecto"
            >
              <RotateCcw className="w-4 h-4" />
              Restablecer
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Guardar configuración"
            >
              <Save className="w-4 h-4" />
              Guardar
            </button>
          </div>
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
    </Modal>
  )
}

/**
 * Hook to get current settings (backward compatibility)
 */
export function useSettings() {
  const { settings } = useAppSettings()
  return settings.dashboard
}
