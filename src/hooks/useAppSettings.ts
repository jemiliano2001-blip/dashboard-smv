import { useState, useEffect } from 'react'
import { logger } from '../utils/logger'
import type { AppSettings } from '../types'
import {
  DEFAULT_APP_SETTINGS,
  DEFAULT_DASHBOARD_SETTINGS,
  DEFAULT_APPEARANCE_SETTINGS,
  type AppearanceSettings,
} from '../types/settings'

const DASHBOARD_SETTINGS_KEY = 'tv-dashboard-settings'
const APP_SETTINGS_KEY = 'app-settings'

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      // Try to load new app settings format
      const saved = localStorage.getItem(APP_SETTINGS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<AppSettings>
        const rawAppearance = parsed.appearance as Partial<AppearanceSettings> | undefined
        const appearance: AppearanceSettings = rawAppearance
          ? { ...DEFAULT_APPEARANCE_SETTINGS, ...rawAppearance }
          : DEFAULT_APPEARANCE_SETTINGS
        setSettings({
          dashboard: { ...DEFAULT_APP_SETTINGS.dashboard, ...parsed.dashboard },
          adminPanel: { ...DEFAULT_APP_SETTINGS.adminPanel, ...parsed.adminPanel },
          appearance,
        })
      } else {
        // Try to migrate old dashboard settings
        const oldDashboard = localStorage.getItem(DASHBOARD_SETTINGS_KEY)
        if (oldDashboard) {
          const parsed = JSON.parse(oldDashboard) as Partial<typeof DEFAULT_DASHBOARD_SETTINGS>
          setSettings({
            ...DEFAULT_APP_SETTINGS,
            dashboard: { ...DEFAULT_DASHBOARD_SETTINGS, ...parsed },
          })
          // Save in new format
          localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify({
            ...DEFAULT_APP_SETTINGS,
            dashboard: { ...DEFAULT_DASHBOARD_SETTINGS, ...parsed },
          }))
        }
      }
    } catch (error) {
      logger.error('Error loading app settings', error as Error, {
        feature: 'settings',
        action: 'load',
      })
    } finally {
      setLoading(false)
    }

    const handleSettingsChange = (event: Event) => {
      const customEvent = event as CustomEvent<AppSettings | typeof DEFAULT_DASHBOARD_SETTINGS>
      const newSettings = customEvent.detail

      if ('dashboard' in newSettings) {
        const s = newSettings as AppSettings
        setSettings(s)
      } else {
        setSettings({
          ...DEFAULT_APP_SETTINGS,
          dashboard: newSettings as typeof DEFAULT_DASHBOARD_SETTINGS,
        })
      }
    }

    window.addEventListener('settings-changed', handleSettingsChange)
    return () => window.removeEventListener('settings-changed', handleSettingsChange)
  }, [])

  const saveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings)
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(newSettings))
    window.dispatchEvent(new CustomEvent('settings-changed', { detail: newSettings }))
  }

  return {
    settings,
    saveSettings,
    loading,
  }
}
