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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 flex">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-xl border border-white/10 transition-all duration-200 shadow-lg"
        aria-label="Abrir menú"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          ${isCollapsed ? 'w-20' : 'w-72'}
          bg-white/5 backdrop-blur-xl border-r border-white/10
          transform transition-all duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}
        `}
      >
        <div className="h-full flex flex-col">
          <div className="px-6 py-8 border-b border-white/10">
            <div
              className={`flex items-center gap-4 transition-all duration-300 ${isCollapsed ? 'justify-center' : ''}`}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
                <span className="text-white font-black text-xl">V</span>
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold text-white tracking-tight">Panel</h1>
                  <p className="text-xs text-gray-400 mt-0.5">Control y estadísticas</p>
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
                    group relative flex items-center gap-4 px-4 py-3.5 rounded-xl
                    transition-all duration-200
                    ${
                      active
                        ? 'bg-white/10 text-white shadow-lg shadow-blue-500/10'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }
                    ${isCollapsed ? 'justify-center px-3' : ''}
                  `}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-105'}`}
                  />
                  {!isCollapsed && (
                    <span
                      className={`font-medium text-sm transition-all duration-200 ${active ? 'font-semibold' : ''}`}
                    >
                      {item.label}
                    </span>
                  )}
                  {active && !isCollapsed && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="px-4 py-4 border-t border-white/10">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
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
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity duration-300"
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
