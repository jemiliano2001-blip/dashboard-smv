import type { Priority, Status } from '../types'

export const TIMINGS = {
  COMPANY_ROTATION: 30000, // 30 segundos por compañía
  PAGE_ROTATION: 15000, // 15 segundos por página interna
  ORDERS_PER_PAGE: 8, // Órdenes por página
  TOAST_DURATION: 3000, // Duración de toast en ms
} as const

export const GRID_BREAKPOINTS = {
  SMALL_GRID_MAX: 4, // Máximo para grid de 2 columnas
  LARGE_GRID_MIN: 5, // Mínimo para grid de 4 columnas
} as const

export const PRIORITY_COLORS: Record<Priority, string> = {
  critical: 'text-red-500 bg-red-500/10 border-red-500',
  high: 'text-orange-500 bg-orange-500/10 border-orange-500',
  normal: 'text-blue-500 bg-blue-500/10 border-blue-500',
  low: 'text-zinc-500 bg-zinc-500/10 border-zinc-500',
}

export const STATUS_COLORS: Record<Status, string> = {
  scheduled: 'text-blue-500 bg-blue-500/10 border-blue-500',
  production: 'text-amber-500 bg-amber-500/10 border-amber-500',
  quality: 'text-green-500 bg-green-500/10 border-green-500',
  hold: 'text-red-500 bg-red-500/10 border-red-500',
}

export const STATUS_ICONS: Record<Status, string> = {
  scheduled: 'Clock',
  production: 'Cog',
  quality: 'CheckCircle',
  hold: 'AlertCircle',
}

export const VALIDATION_MESSAGES = {
  COMPANY_NAME_REQUIRED: 'El nombre de la compañía es requerido',
  PO_NUMBER_REQUIRED: 'El número de PO es requerido',
  PART_NAME_REQUIRED: 'El nombre de la pieza es requerido',
  QUANTITY_TOTAL_INVALID: 'La cantidad total debe ser mayor o igual a 0',
  QUANTITY_COMPLETED_INVALID: 'La cantidad completada debe ser mayor o igual a 0',
  QUANTITY_EXCEEDS_TOTAL: 'La cantidad completada no puede ser mayor que la cantidad total',
  PRIORITY_INVALID: 'Prioridad inválida',
  STATUS_INVALID: 'Estado inválido',
} as const

export const ERROR_MESSAGES = {
  CONNECTION_LOST: 'Conexión perdida. Reconectando...',
  FETCH_FAILED: 'Error al obtener las órdenes de trabajo',
  CREATE_FAILED: 'Error al crear la orden',
  UPDATE_FAILED: 'Error al actualizar la orden',
  DELETE_FAILED: 'Error al eliminar la orden',
} as const

export const SUCCESS_MESSAGES = {
  ORDER_CREATED: 'Orden creada exitosamente',
  ORDER_UPDATED: 'Orden actualizada exitosamente',
  ORDER_DELETED: 'Orden eliminada exitosamente',
} as const

export const VALID_PRIORITIES: readonly Priority[] = ['low', 'normal', 'high', 'critical'] as const
export const VALID_STATUSES: readonly Status[] = ['scheduled', 'production', 'quality', 'hold'] as const

export const INPUT_LIMITS = {
  COMPANY_NAME_MAX: 200,
  PO_NUMBER_MAX: 100,
  PART_NAME_MAX: 300,
  QUANTITY_MAX: 999999,
  QUANTITY_MIN: 0,
} as const

/** Max characters for part_name summary on cards (full text in tooltip/form/export). */
export const PART_NAME_DISPLAY_MAX = 50

export const SETTINGS_LIMITS = {
  COMPANY_ROTATION_MIN: 5,
  COMPANY_ROTATION_MAX: 300,
  PAGE_ROTATION_MIN: 5,
  PAGE_ROTATION_MAX: 300,
  ORDERS_PER_PAGE_MIN: 4,
  ORDERS_PER_PAGE_MAX: 100,
} as const

export const GRID_SETTINGS_LIMITS = {
  COLUMNS_MIN: 2,
  COLUMNS_MAX: 12,
  ROWS_MIN: 2,
  ROWS_MAX: 10,
} as const

export const ACCESSIBILITY = {
  MIN_FONT_SIZE_PX: 12, // WCAG AA standard minimum font size
} as const

export const CARD_SIZE_PRESETS = {
  small: {
    default: 8,
    lg: 10,
    xl: 12,
    '2xl': 12,
  },
  medium: {
    default: 6,
    lg: 8,
    xl: 10,
    '2xl': 12,
  },
  large: {
    default: 4,
    lg: 6,
    xl: 8,
    '2xl': 10,
  },
} as const

export type CardSize = keyof typeof CARD_SIZE_PRESETS
