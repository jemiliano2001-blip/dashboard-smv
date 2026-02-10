import type { DashboardSettings, GridBreakpoints, CardSize } from '../types'
import { CARD_SIZE_PRESETS } from './constants'

/** Legacy grid defaults for generateGridClasses (dashboard now uses fixed TV layout). */
const LEGACY_GRID_DEFAULTS: { gridColumns: GridBreakpoints; gridRows: GridBreakpoints } = {
  gridColumns: { default: 3, lg: 4, xl: 5, '2xl': 6 },
  gridRows: { default: 3, lg: 3, xl: 3, '2xl': 3 },
}

/**
 * Get grid columns based on card size preset
 */
export function getCardSizeGridColumns(cardSize: CardSize): GridBreakpoints {
  return CARD_SIZE_PRESETS[cardSize]
}

/**
 * Calculate grid capacity (columns × rows) for a given breakpoint
 */
export function getGridCapacity(
  columns: GridBreakpoints,
  rows: GridBreakpoints,
  breakpoint: 'default' | 'lg' | 'xl' | '2xl' = 'default'
): number {
  const cols = columns[breakpoint]
  const rowCount = rows[breakpoint]
  return cols * rowCount
}

/**
 * Validate grid capacity meets minimum requirements
 */
export function validateGridCapacity(
  columns: GridBreakpoints,
  rows: GridBreakpoints,
  minCapacity: number
): { valid: boolean; issues: string[] } {
  const issues: string[] = []
  const breakpoints: Array<'default' | 'lg' | 'xl' | '2xl'> = ['default', 'lg', 'xl', '2xl']

  for (const breakpoint of breakpoints) {
    const capacity = getGridCapacity(columns, rows, breakpoint)
    if (capacity < minCapacity) {
      issues.push(
        `Capacidad insuficiente en ${breakpoint}: ${capacity} (requerido: ${minCapacity})`
      )
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}

export interface DynamicGridLayout {
  rows: number
  columns: number
  cardMinHeight: number
  gap: string
  useAutoRows: boolean
}

/**
 * Calculate dynamic grid layout based on order count and available space
 * Limits to maximum 3 rows and automatically increases columns when needed
 */
export function calculateDynamicGridLayout(
  orderCount: number,
  columns: number,
  availableHeight: number,
  headerHeight: number = 64,
  footerHeight: number = 48,
  padding: number = 64, // 32px top + 32px bottom (p-8)
  minimalGaps: boolean = false
): DynamicGridLayout {
  // Calculate available height for grid content
  const gridHeight = availableHeight - headerHeight - footerHeight - padding
  
  // Calculate number of rows needed
  let rows = Math.ceil(orderCount / columns)
  
  // Limit to maximum 3 rows - if more rows needed, increase columns
  const MAX_ROWS = 3
  if (rows > MAX_ROWS) {
    columns = Math.ceil(orderCount / MAX_ROWS)
    // Ensure columns don't exceed maximum (12)
    columns = Math.min(columns, 12)
    rows = MAX_ROWS
  }
  
  // Calculate gap size based on order count and minimal gaps setting
  let gap: string
  if (minimalGaps) {
    // Minimal gaps: smaller when few orders, normal when many
    gap = orderCount <= 12 ? 'gap-1' : 'gap-2'
  } else {
    // Normal gaps: adjust based on order count
    if (orderCount <= 6) {
      gap = 'gap-2' // Reduced from gap-4 for compact layout
    } else if (orderCount <= 12) {
      gap = 'gap-2'
    } else if (orderCount <= 20) {
      gap = 'gap-1.5'
    } else {
      gap = 'gap-1' // Very compact when many orders
    }
  }
  
  // Calculate gap size in pixels for height calculation
  const gapSizePx = minimalGaps 
    ? (orderCount <= 12 ? 4 : 8)
    : (orderCount <= 6 ? 8 : orderCount <= 12 ? 8 : orderCount <= 20 ? 6 : 4)
  
  // Calculate total gap height (rows - 1 gaps between rows)
  const totalGapHeight = rows > 1 ? (rows - 1) * gapSizePx : 0
  
  // Calculate available height per card
  const availableHeightPerCard = (gridHeight - totalGapHeight) / rows
  
  // Calculate minimum card height (reduced from 90px to 60px for compact horizontal cards)
  const minCardHeight = Math.max(60, availableHeightPerCard)
  
  // Use auto-rows when we have fewer orders than max capacity to allow stretching
  const useAutoRows = orderCount < (columns * rows)
  
  return {
    rows,
    columns,
    cardMinHeight: minCardHeight,
    gap,
    useAutoRows,
  }
}

/**
 * Generate dynamic grid classes without fixed rows
 */
export function generateDynamicGridClasses(
  columns: GridBreakpoints,
  breakpoint: 'default' | 'lg' | 'xl' | '2xl' = 'default'
): string {
  const cols = columns[breakpoint]
  
  const classes = [
    `grid-cols-${cols}`,
  ]
  
  // Add responsive classes for larger breakpoints
  if (breakpoint === 'default') {
    classes.push(
      `lg:grid-cols-${columns.lg}`,
      `xl:grid-cols-${columns.xl}`,
      `2xl:grid-cols-${columns['2xl']}`
    )
  }
  
  return classes.join(' ')
}

/**
 * Generate grid classes with support for dynamic mode
 */
export function generateGridClasses(
  settings: Partial<DashboardSettings>,
  dynamicMode: boolean = false
): string {
  // Use card size preset if available, otherwise use manual grid columns (legacy)
  const legacy = settings as Partial<DashboardSettings> & { cardSize?: CardSize; gridColumns?: GridBreakpoints }
  const gridColumns = legacy.cardSize
    ? getCardSizeGridColumns(legacy.cardSize)
    : (settings as Partial<DashboardSettings & { gridColumns?: GridBreakpoints }>).gridColumns || LEGACY_GRID_DEFAULTS.gridColumns

  if (dynamicMode) {
    return generateDynamicGridClasses(gridColumns)
  }

  const gridRows = (settings as Partial<DashboardSettings & { gridRows?: GridBreakpoints }>).gridRows || LEGACY_GRID_DEFAULTS.gridRows

  const classes = [
    `grid-cols-${gridColumns.default}`,
    `lg:grid-cols-${gridColumns.lg}`,
    `xl:grid-cols-${gridColumns.xl}`,
    `2xl:grid-cols-${gridColumns['2xl']}`,
    `grid-rows-${gridRows.default}`,
    `lg:grid-rows-${gridRows.lg}`,
    `xl:grid-rows-${gridRows.xl}`,
    `2xl:grid-rows-${gridRows['2xl']}`,
  ]

  return classes.join(' ')
}
