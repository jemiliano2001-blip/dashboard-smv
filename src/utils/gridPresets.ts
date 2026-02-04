import type { DashboardSettings, GridBreakpoints } from '../types'

export type GridPreset = 'compact' | 'balanced' | 'spacious'

export interface GridPresetConfig {
  name: string
  description: string
  gridColumns: GridBreakpoints
  gridRows: GridBreakpoints
  dynamicGridEnabled: boolean
  minimalGapsEnabled: boolean
}

export const GRID_PRESETS: Record<GridPreset, GridPresetConfig> = {
  compact: {
    name: 'Compacto',
    description: 'Máximo de tarjetas visibles',
    gridColumns: {
      default: 4,
      lg: 5,
      xl: 6,
      '2xl': 6,
    },
    gridRows: {
      default: 6,
      lg: 7,
      xl: 8,
      '2xl': 8,
    },
    dynamicGridEnabled: true,
    minimalGapsEnabled: true,
  },
  balanced: {
    name: 'Balanceado',
    description: 'Equilibrio entre cantidad y tamaño',
    gridColumns: {
      default: 3,
      lg: 4,
      xl: 5,
      '2xl': 5,
    },
    gridRows: {
      default: 5,
      lg: 6,
      xl: 6,
      '2xl': 6,
    },
    dynamicGridEnabled: true,
    minimalGapsEnabled: false,
  },
  spacious: {
    name: 'Espacioso',
    description: 'Tarjetas grandes, menos cantidad',
    gridColumns: {
      default: 2,
      lg: 3,
      xl: 3,
      '2xl': 4,
    },
    gridRows: {
      default: 4,
      lg: 4,
      xl: 5,
      '2xl': 5,
    },
    dynamicGridEnabled: true,
    minimalGapsEnabled: false,
  },
}

/** @deprecated Dashboard uses fixed TV layout (3 columns). Preset grid config is ignored. */
export function applyGridPreset(
  settings: DashboardSettings,
  _preset: GridPreset
): DashboardSettings {
  return { ...settings }
}

export function getPresetCapacity(preset: GridPreset, breakpoint: keyof GridBreakpoints = 'default'): number {
  const presetConfig = GRID_PRESETS[preset]
  return presetConfig.gridColumns[breakpoint] * presetConfig.gridRows[breakpoint]
}
