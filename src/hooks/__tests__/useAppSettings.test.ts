import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAppSettings } from '../useAppSettings'
import { DEFAULT_APP_SETTINGS, DEFAULT_DASHBOARD_SETTINGS } from '../../types/settings'

const APP_SETTINGS_KEY = 'app-settings'
const DASHBOARD_SETTINGS_KEY = 'tv-dashboard-settings'

let mockStorage: Record<string, string>

beforeEach(() => {
  mockStorage = {}
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => mockStorage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key]
    }),
    clear: vi.fn(() => {
      mockStorage = {}
    }),
    key: vi.fn(),
    length: 0,
  } as unknown as Storage)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useAppSettings', () => {
  it('devuelve settings por defecto cuando no hay nada en localStorage', () => {
    const { result } = renderHook(() => useAppSettings())

    expect(result.current.settings.dashboard).toBeDefined()
    expect(result.current.settings.dashboard).toEqual(DEFAULT_APP_SETTINGS.dashboard)
    expect(result.current.settings.adminPanel).toEqual(DEFAULT_APP_SETTINGS.adminPanel)
    expect(result.current.settings.appearance).toEqual(DEFAULT_APP_SETTINGS.appearance)
    expect(result.current.loading).toBe(false)
  })

  it('carga settings válidos desde localStorage', () => {
    const customSettings = {
      ...DEFAULT_APP_SETTINGS,
      dashboard: { ...DEFAULT_APP_SETTINGS.dashboard, ordersPerPage: 12 },
    }
    mockStorage[APP_SETTINGS_KEY] = JSON.stringify(customSettings)

    const { result } = renderHook(() => useAppSettings())

    expect(result.current.settings.dashboard.ordersPerPage).toBe(12)
    expect(result.current.loading).toBe(false)
  })

  it('cae a defaults cuando localStorage tiene JSON inválido', () => {
    mockStorage[APP_SETTINGS_KEY] = 'not-valid-json'

    const { result } = renderHook(() => useAppSettings())

    expect(result.current.settings).toEqual(DEFAULT_APP_SETTINGS)
    expect(result.current.loading).toBe(false)
  })

  it('cae a defaults cuando schema validation falla', () => {
    // priority is not a valid field for app settings root
    mockStorage[APP_SETTINGS_KEY] = JSON.stringify({
      dashboard: { companyRotation: -5 }, // negative, will fail positive() validation
    })

    const { result } = renderHook(() => useAppSettings())

    // Should fall back to defaults since companyRotation: -5 fails z.positive()
    expect(result.current.settings.dashboard.companyRotation).toBe(
      DEFAULT_APP_SETTINGS.dashboard.companyRotation
    )
  })

  it('migra settings legacy del formato dashboard antiguo', () => {
    const legacySettings = {
      companyRotation: 45,
      pageRotation: 20,
      ordersPerPage: 10,
    }
    mockStorage[DASHBOARD_SETTINGS_KEY] = JSON.stringify(legacySettings)

    const { result } = renderHook(() => useAppSettings())

    expect(result.current.settings.dashboard.companyRotation).toBe(45)
    expect(result.current.settings.dashboard.pageRotation).toBe(20)
    expect(result.current.settings.dashboard.ordersPerPage).toBe(10)
    // Should have saved in new format
    expect(localStorage.setItem).toHaveBeenCalledWith(
      APP_SETTINGS_KEY,
      expect.any(String)
    )
  })

  it('saveSettings persiste y notifica cambios', () => {
    const { result } = renderHook(() => useAppSettings())

    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    const newSettings = {
      ...DEFAULT_APP_SETTINGS,
      dashboard: { ...DEFAULT_APP_SETTINGS.dashboard, ordersPerPage: 16 },
    }

    act(() => {
      result.current.saveSettings(newSettings)
    })

    expect(result.current.settings.dashboard.ordersPerPage).toBe(16)
    expect(localStorage.setItem).toHaveBeenCalledWith(
      APP_SETTINGS_KEY,
      JSON.stringify(newSettings)
    )
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'settings-changed' })
    )

    dispatchSpy.mockRestore()
  })

  it('reacciona a eventos settings-changed con AppSettings', () => {
    const { result } = renderHook(() => useAppSettings())

    const updatedSettings = {
      ...DEFAULT_APP_SETTINGS,
      dashboard: { ...DEFAULT_APP_SETTINGS.dashboard, companyRotation: 60 },
    }

    act(() => {
      window.dispatchEvent(
        new CustomEvent('settings-changed', { detail: updatedSettings })
      )
    })

    expect(result.current.settings.dashboard.companyRotation).toBe(60)
  })

  it('reacciona a eventos settings-changed con formato legacy (dashboard only)', () => {
    const { result } = renderHook(() => useAppSettings())

    const legacyDashboard = {
      ...DEFAULT_DASHBOARD_SETTINGS,
      pageRotation: 25,
    }

    act(() => {
      window.dispatchEvent(
        new CustomEvent('settings-changed', { detail: legacyDashboard })
      )
    })

    expect(result.current.settings.dashboard.pageRotation).toBe(25)
  })

  it('merges appearance con defaults cuando faltan campos', () => {
    const partialSettings = {
      dashboard: DEFAULT_APP_SETTINGS.dashboard,
      adminPanel: DEFAULT_APP_SETTINGS.adminPanel,
      appearance: { density: 'compact' as const },
    }
    mockStorage[APP_SETTINGS_KEY] = JSON.stringify(partialSettings)

    const { result } = renderHook(() => useAppSettings())

    expect(result.current.settings.appearance.density).toBe('compact')
    // Other appearance fields should have defaults
    expect(result.current.settings.appearance.fontSize).toBe('medium')
    expect(result.current.settings.appearance.animationsEnabled).toBe(true)
  })
})
