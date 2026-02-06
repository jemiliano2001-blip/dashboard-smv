import { useState, memo } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Home, FileText, Settings, List, Menu, X, ChevronLeft, BarChart3 } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', label: 'Vista TV', icon: Home },
  { path: '/admin', label: 'Órdenes', icon: List },
  { path: '/admin/settings', label: 'Configuración', icon: Settings },
  { path: '/admin/logs', label: 'Logs', icon: FileText },
  { path: '/stats', label: 'Estadísticas', icon: BarChart3 },
] as const

function isActive(path: string, location: ReturnType<typeof useLocation>): boolean {
  if (path === '/') return location.pathname === '/'
  if (path === '/admin') {
    return (
      location.pathname === '/admin' ||
      (location.pathname.startsWith('/admin/') &&
        location.pathname !== '/admin/logs' &&
        location.pathname !== '/admin/settings')
    )
  }
  return location.pathname === path
}

export const DashboardLayout = memo(function DashboardLayout() {
  const location = useLocation()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm backdrop-blur-sm text-zinc-900 dark:text-zinc-100 transition-all duration-200"
        aria-label="Abrir menú"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          ${isCollapsed ? 'w-20' : 'w-72'}
          bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-r border-zinc-200 dark:border-zinc-800
          transform transition-all duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}
        `}
      >
        <div className="h-full flex flex-col">
          <div className="px-6 py-8 border-b border-zinc-200 dark:border-zinc-800">
            <div
              className={`flex items-center gap-4 transition-all duration-300 ${isCollapsed ? 'justify-center' : ''}`}
            >
              <div className="w-10 h-10 bg-zinc-900 dark:bg-zinc-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white dark:text-zinc-900 font-bold text-lg">V</span>
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">Panel</h1>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Control y estadísticas</p>
                </div>
              )}
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path, location)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    group relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200
                    ${
                      active
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }
                    ${isCollapsed ? 'justify-center px-2' : ''}
                  `}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${active ? 'text-zinc-900 dark:text-zinc-100' : ''}`}
                  />
                  {!isCollapsed && (
                    <span className="text-sm">{item.label}</span>
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="px-4 py-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full flex items-center justify-center gap-3 px-3 py-2.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
              aria-label={isCollapsed ? 'Expandir menú' : 'Contraer menú'}
            >
              <ChevronLeft
                className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
              />
              {!isCollapsed && <span className="text-sm font-medium">Contraer</span>}
            </button>
          </div>
        </div>

        {isMobileOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30 transition-opacity duration-300"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden
          />
        )}
      </aside>

      <div className="flex-1 flex flex-col lg:ml-0 min-w-0">
        <Outlet />
      </div>
    </div>
  )
})
