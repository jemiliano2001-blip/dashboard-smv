export interface GridBreakpoints {
  default: number
  lg: number
  xl: number
  '2xl': number
}

export type CardSize = 'small' | 'medium' | 'large'
export type Density = 'compact' | 'comfortable' | 'spacious'
export type FontSize = 'small' | 'medium' | 'large'
export type Contrast = 'normal' | 'high'
export type SortColumn = 'company_name' | 'po_number' | 'part_name' | 'created_at' | 'priority' | 'status'
export type SortOrder = 'asc' | 'desc'

export type ColumnDensity = 'auto' | 4 | 6 | 8 | 10
export type TextSize = 'normal' | 'large' | 'extra-large'

export interface DashboardSettings {
  companyRotation: number
  pageRotation: number
  ordersPerPage: number
  autoScrollEnabled: boolean
  autoScrollInterval: number
  fitToScreen: boolean
  columnDensity: ColumnDensity
  textSize: TextSize
  prioritizeOldOrders: boolean
  groupBySize: boolean
  autoRefreshInterval: number
}

export interface AdminPanelSettings {
  defaultItemsPerPage: number
  defaultSortColumn: SortColumn
  defaultSortOrder: SortOrder
  autoRefreshInterval: number
  bulkOperationsEnabled: boolean
  quickActionsEnabled: boolean
  showMetricsByDefault: boolean
}

export interface AppearanceSettings {
  density: Density
  fontSize: FontSize
  contrast: Contrast
  animationsEnabled: boolean
}

export interface AppSettings {
  dashboard: DashboardSettings
  adminPanel: AdminPanelSettings
  appearance: AppearanceSettings
  lastModified?: string
}

export interface SettingsPreset {
  id: string
  name: string
  description?: string
  settings: Partial<AppSettings>
  isDefault?: boolean
  createdAt: string
}

export const DEFAULT_DASHBOARD_SETTINGS: DashboardSettings = {
  companyRotation: 30,
  pageRotation: 15,
  ordersPerPage: 8,
  autoScrollEnabled: true,
  autoScrollInterval: 15,
  fitToScreen: true,
  columnDensity: 'auto',
  textSize: 'normal',
  prioritizeOldOrders: false,
  groupBySize: false,
  autoRefreshInterval: 5,
}

export const DEFAULT_ADMIN_PANEL_SETTINGS: AdminPanelSettings = {
  defaultItemsPerPage: 25,
  defaultSortColumn: 'company_name',
  defaultSortOrder: 'asc',
  autoRefreshInterval: 5000,
  bulkOperationsEnabled: true,
  quickActionsEnabled: true,
  showMetricsByDefault: true,
}

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  density: 'comfortable',
  fontSize: 'medium',
  contrast: 'normal',
  animationsEnabled: true,
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  dashboard: DEFAULT_DASHBOARD_SETTINGS,
  adminPanel: DEFAULT_ADMIN_PANEL_SETTINGS,
  appearance: DEFAULT_APPEARANCE_SETTINGS,
}

// Backward compatibility
export const DEFAULT_SETTINGS: DashboardSettings = DEFAULT_DASHBOARD_SETTINGS

// Export all settings types
export type { DashboardSettings, AdminPanelSettings, AppearanceSettings, AppSettings, SettingsPreset, SortColumn, SortOrder, Density, FontSize, Contrast, ColumnDensity, TextSize }
