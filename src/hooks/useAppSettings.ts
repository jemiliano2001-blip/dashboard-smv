import { useState, useEffect } from 'react'
import { z } from 'zod'
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

const dashboardSettingsSchema = z.object({
  companyRotation: z.number().int().positive().optional(),
  pageRotation: z.number().int().positive().optional(),
  ordersPerPage: z.number().int().positive().optional(),
  fitToScreen: z.boolean().optional(),
  columnDensity: z.union([z.literal('auto'), z.literal(4), z.literal(6), z.literal(8), z.literal(10)]).optional(),
  textSize: z.union([z.literal('normal'), z.literal('large'), z.literal('extra-large')]).optional(),
  prioritizeOldOrders: z.boolean().optional(),
  groupBySize: z.boolean().optional(),
  autoRefreshInterval: z.number().int().nonnegative().optional(),
})

const adminPanelSettingsSchema = z.object({
  defaultItemsPerPage: z.number().int().positive().optional(),
  defaultSortColumn: z
    .union([
      z.literal('company_name'),
      z.literal('po_number'),
      z.literal('part_name'),
      z.literal('created_at'),
      z.literal('priority'),
      z.literal('status'),
    ])
    .optional(),
  defaultSortOrder: z.union([z.literal('asc'), z.literal('desc')]).optional(),
  autoRefreshInterval: z.number().int().nonnegative().optional(),
  bulkOperationsEnabled: z.boolean().optional(),
  quickActionsEnabled: z.boolean().optional(),
  showMetricsByDefault: z.boolean().optional(),
})

const appearanceSettingsSchema = z.object({
  density: z.union([z.literal('compact'), z.literal('comfortable'), z.literal('spacious')]).optional(),
  fontSize: z.union([z.literal('small'), z.literal('medium'), z.literal('large')]).optional(),
  contrast: z.union([z.literal('normal'), z.literal('high')]).optional(),
  animationsEnabled: z.boolean().optional(),
})

const appSettingsSchema = z.object({
  dashboard: dashboardSettingsSchema.optional(),
  adminPanel: adminPanelSettingsSchema.optional(),
  appearance: appearanceSettingsSchema.optional(),
})

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      // Try to load new app settings format
      const saved = localStorage.getItem(APP_SETTINGS_KEY)
      if (saved) {
        const parsedJson = JSON.parse(saved)
        const result = appSettingsSchema.safeParse(parsedJson)

        if (!result.success) {
          logger.error('Invalid app settings in localStorage, falling back to defaults', result.error, {
            feature: 'settings',
            action: 'validate_load',
          })
          setSettings(DEFAULT_APP_SETTINGS)
        } else {
          const parsed = result.data as Partial<AppSettings>
          const rawAppearance = parsed.appearance as Partial<AppearanceSettings> | undefined
          const appearance: AppearanceSettings = rawAppearance
            ? { ...DEFAULT_APPEARANCE_SETTINGS, ...rawAppearance }
            : DEFAULT_APPEARANCE_SETTINGS

          setSettings({
            dashboard: { ...DEFAULT_APP_SETTINGS.dashboard, ...parsed.dashboard },
            adminPanel: { ...DEFAULT_APP_SETTINGS.adminPanel, ...parsed.adminPanel },
            appearance,
          })
        }
      } else {
        // Try to migrate old dashboard settings
        const oldDashboard = localStorage.getItem(DASHBOARD_SETTINGS_KEY)
        if (oldDashboard) {
          const parsedJson = JSON.parse(oldDashboard)
          const result = dashboardSettingsSchema.safeParse(parsedJson)

          if (!result.success) {
            logger.error('Invalid legacy dashboard settings in localStorage, using defaults', result.error, {
              feature: 'settings',
              action: 'validate_migration',
            })
            setSettings(DEFAULT_APP_SETTINGS)
            localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(DEFAULT_APP_SETTINGS))
          } else {
            const parsed = result.data as Partial<typeof DEFAULT_DASHBOARD_SETTINGS>
            const nextSettings: AppSettings = {
              ...DEFAULT_APP_SETTINGS,
              dashboard: { ...DEFAULT_DASHBOARD_SETTINGS, ...parsed },
            }
            setSettings(nextSettings)
            // Save in new format
            localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(nextSettings))
          }
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
