import type { AppSettings } from '../types'

interface SearchableSetting {
  label: string
  description?: string
  value: string | number | boolean
  category: string
  tab: string
}

/**
 * Extract all searchable settings from AppSettings
 */
export function extractSearchableSettings(settings: AppSettings): SearchableSetting[] {
  const searchable: SearchableSetting[] = []

  // Dashboard settings
  searchable.push(
    { label: 'Rotación por Compañía', description: 'Tiempo que se muestra cada compañía', value: `${settings.dashboard.companyRotation} seg`, category: 'Tiempos', tab: 'dashboard' },
    { label: 'Rotación por Página', description: 'Tiempo que se muestra cada página', value: `${settings.dashboard.pageRotation} seg`, category: 'Tiempos', tab: 'dashboard' },
    { label: 'Capacidad del Dashboard', description: 'Número máximo de órdenes mostradas por página', value: `${settings.dashboard.ordersPerPage} órdenes`, category: 'Tiempos', tab: 'dashboard' },
    { label: 'Activar Auto-Scroll', description: 'El dashboard automáticamente cambiará de página', value: settings.dashboard.autoScrollEnabled ? 'Activado' : 'Desactivado', category: 'Auto-Scroll', tab: 'dashboard' },
    { label: 'Intervalo de Auto-Scroll', description: 'Tiempo que se muestra cada página', value: `${settings.dashboard.autoScrollInterval} seg`, category: 'Auto-Scroll', tab: 'dashboard' }
  )

  // Admin Panel settings
  searchable.push(
    { label: 'Items por Página (Por Defecto)', description: 'Número de órdenes mostradas por página', value: `${settings.adminPanel.defaultItemsPerPage} órdenes`, category: 'Paginación y Ordenamiento', tab: 'admin' },
    { label: 'Columna de Ordenamiento', description: 'Columna por la cual se ordenan las órdenes', value: settings.adminPanel.defaultSortColumn, category: 'Paginación y Ordenamiento', tab: 'admin' },
    { label: 'Orden', description: 'Dirección del ordenamiento', value: settings.adminPanel.defaultSortOrder === 'asc' ? 'Ascendente' : 'Descendente', category: 'Paginación y Ordenamiento', tab: 'admin' },
    { label: 'Intervalo de Auto-Refresh', description: 'El panel se actualiza automáticamente', value: `${settings.adminPanel.autoRefreshInterval} ms`, category: 'Actualización Automática', tab: 'admin' },
    { label: 'Habilitar Operaciones en Lote', description: 'Permite editar múltiples órdenes a la vez', value: settings.adminPanel.bulkOperationsEnabled ? 'Activado' : 'Desactivado', category: 'Operaciones en Lote', tab: 'admin' },
    { label: 'Habilitar Acciones Rápidas', description: 'Menú contextual y acciones rápidas', value: settings.adminPanel.quickActionsEnabled ? 'Activado' : 'Desactivado', category: 'Acciones Rápidas', tab: 'admin' },
    { label: 'Mostrar Métricas por Defecto', description: 'Mostrar el dashboard de métricas', value: settings.adminPanel.showMetricsByDefault ? 'Activado' : 'Desactivado', category: 'Vista de Métricas', tab: 'admin' }
  )

  // Appearance settings
  searchable.push(
    { label: 'Densidad de Información', description: 'Ajusta el espaciado entre elementos', value: settings.appearance.density === 'compact' ? 'Compacto' : settings.appearance.density === 'comfortable' ? 'Cómodo' : 'Espacioso', category: 'Densidad de Información', tab: 'appearance' },
    { label: 'Tamaño de Fuente', description: 'Ajusta el tamaño de la tipografía', value: settings.appearance.fontSize === 'small' ? 'Pequeño' : settings.appearance.fontSize === 'medium' ? 'Mediano' : 'Grande', category: 'Tamaño de Fuente', tab: 'appearance' },
    { label: 'Contraste', description: 'Ajusta el contraste de colores', value: settings.appearance.contrast === 'normal' ? 'Normal' : 'Alto', category: 'Contraste', tab: 'appearance' },
    { label: 'Habilitar Animaciones', description: 'Activa transiciones suaves y efectos', value: settings.appearance.animationsEnabled ? 'Activado' : 'Desactivado', category: 'Animaciones', tab: 'appearance' }
  )

  return searchable
}

/**
 * Search settings by query
 */
export function searchSettings(settings: AppSettings, query: string): {
  matchingTabs: Set<string>
  matchingSettings: SearchableSetting[]
} {
  if (!query.trim()) {
    return {
      matchingTabs: new Set(['dashboard', 'admin', 'appearance', 'advanced']),
      matchingSettings: [],
    }
  }

  const searchable = extractSearchableSettings(settings)
  const queryLower = query.toLowerCase()
  const matchingSettings = searchable.filter((setting) => {
    return (
      setting.label.toLowerCase().includes(queryLower) ||
      setting.description?.toLowerCase().includes(queryLower) ||
      String(setting.value).toLowerCase().includes(queryLower) ||
      setting.category.toLowerCase().includes(queryLower)
    )
  })

  const matchingTabs = new Set(matchingSettings.map((s) => s.tab))
  // Always include advanced tab as it has presets and import/export
  matchingTabs.add('advanced')

  return {
    matchingTabs,
    matchingSettings,
  }
}
