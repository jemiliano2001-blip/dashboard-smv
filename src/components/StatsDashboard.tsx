import { useMemo, useState, lazy, Suspense } from 'react'
import { useWorkOrders } from '../hooks/useWorkOrders'
import { PageHeader } from '../layouts/PageHeader'
import { TrendingUp, Package, Clock, CheckCircle, AlertTriangle, BarChart3, Calendar } from 'lucide-react'
import { PRIORITY_COLORS } from '../utils/constants'
import type { Priority } from '../types'

const STATS_BREADCRUMBS = [{ path: '/admin', label: 'Inicio' }, { path: '/stats', label: 'Estadísticas' }]

// Lazy load charts for better performance
const LineChart = lazy(() => import('./Charts').then(m => ({ default: m.LineChart })))
const BarChart = lazy(() => import('./Charts').then(m => ({ default: m.BarChart })))
const PieChart = lazy(() => import('./Charts').then(m => ({ default: m.PieChart })))
const AreaChart = lazy(() => import('./Charts').then(m => ({ default: m.AreaChart })))
const CombinedChart = lazy(() => import('./Charts').then(m => ({ default: m.CombinedChart })))

interface CompanyStats {
  total: number
  completed: number
  inProduction: number
  onHold: number
}

interface StatsData {
  total: number
  inProduction: number
  completed: number
  onHold: number
  scheduled: number
  overallProgress: number
  totalQuantity: number
  completedQuantity: number
  priorityDistribution: Record<Priority, number>
  companyStats: Record<string, CompanyStats>
}

type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'combined'

/**
 * Statistics Dashboard component
 */
export function StatsDashboard() {
  const { workOrders } = useWorkOrders()
  const [activeChart, setActiveChart] = useState<ChartType>('line')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  })

  const stats = useMemo((): StatsData => {
    const total = workOrders.length
    const inProduction = workOrders.filter((o) => o.status === 'production').length
    const completed = workOrders.filter((o) => o.status === 'quality').length
    const onHold = workOrders.filter((o) => o.status === 'hold').length
    const scheduled = workOrders.filter((o) => o.status === 'scheduled').length

    const totalQuantity = workOrders.reduce((sum, o) => sum + (o.quantity_total || 0), 0)
    const completedQuantity = workOrders.reduce((sum, o) => sum + (o.quantity_completed || 0), 0)
    const overallProgress = totalQuantity > 0 ? Math.round((completedQuantity / totalQuantity) * 100) : 0

    const priorityDistribution: Record<Priority, number> = {
      critical: workOrders.filter((o) => o.priority === 'critical').length,
      high: workOrders.filter((o) => o.priority === 'high').length,
      normal: workOrders.filter((o) => o.priority === 'normal').length,
      low: workOrders.filter((o) => o.priority === 'low').length,
    }

    const companyStats = workOrders.reduce<Record<string, CompanyStats>>((acc, order) => {
      const company = order.company_name || 'Sin Compañía'
      if (!acc[company]) {
        acc[company] = {
          total: 0,
          completed: 0,
          inProduction: 0,
          onHold: 0,
        }
      }
      acc[company].total++
      if (order.status === 'quality') acc[company].completed++
      if (order.status === 'production') acc[company].inProduction++
      if (order.status === 'hold') acc[company].onHold++
      return acc
    }, {})

    return {
      total,
      inProduction,
      completed,
      onHold,
      scheduled,
      overallProgress,
      totalQuantity,
      completedQuantity,
      priorityDistribution,
      companyStats,
    }
  }, [workOrders])

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-4 md:px-8 py-4 md:py-6 flex-shrink-0">
        <PageHeader
          title="Dashboard de Estadísticas"
          description="Análisis y métricas de las órdenes de trabajo"
          breadcrumbs={STATS_BREADCRUMBS}
        />
      </header>
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-[1920px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
          <div className="glass rounded-xl border border-slate-700/50 p-6 shadow-multi hover:shadow-glow-blue transition-all duration-300 hover:scale-105 animate-slide-up" style={{ animationDelay: '0ms' }}>
            <div className="flex items-center justify-between mb-4">
              <Package className="w-8 h-8 text-blue-400 drop-shadow-lg" />
              <TrendingUp className="w-5 h-5 text-green-400 drop-shadow-lg" />
            </div>
            <div className="text-3xl font-black text-white mb-1 text-shadow">{stats.total}</div>
            <div className="text-sm text-gray-400">Total de Órdenes</div>
          </div>

          <div className="glass rounded-xl border border-slate-700/50 p-6 shadow-multi hover:shadow-glow-blue transition-all duration-300 hover:scale-105 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-yellow-400 drop-shadow-lg" />
              <TrendingUp className="w-5 h-5 text-yellow-400 drop-shadow-lg" />
            </div>
            <div className="text-3xl font-black text-white mb-1 text-shadow">{stats.inProduction}</div>
            <div className="text-sm text-gray-400">En Producción</div>
          </div>

          <div className="glass rounded-xl border border-slate-700/50 p-6 shadow-multi hover:shadow-glow-blue transition-all duration-300 hover:scale-105 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-8 h-8 text-green-400 drop-shadow-lg" />
              <TrendingUp className="w-5 h-5 text-green-400 drop-shadow-lg" />
            </div>
            <div className="text-3xl font-black text-white mb-1 text-shadow">{stats.completed}</div>
            <div className="text-sm text-gray-400">Completadas</div>
          </div>

          <div className="glass rounded-xl border border-slate-700/50 p-6 shadow-multi hover:shadow-glow-blue transition-all duration-300 hover:scale-105 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center justify-between mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400 drop-shadow-lg" />
              <TrendingUp className="w-5 h-5 text-red-400 drop-shadow-lg" />
            </div>
            <div className="text-3xl font-black text-white mb-1 text-shadow">{stats.onHold}</div>
            <div className="text-sm text-gray-400">En Hold</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="glass rounded-xl border border-slate-700/50 p-6 shadow-multi hover:shadow-glow-blue transition-all duration-300 animate-slide-up" style={{ animationDelay: '400ms' }}>
            <h2 className="text-xl font-black text-white mb-4 text-shadow-lg">Progreso General</h2>
            <div className="mb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300">Progreso Total</span>
                <span className="text-xl font-black text-blue-400 text-shadow">{stats.overallProgress}%</span>
              </div>
              <div className="w-full bg-slate-700/70 rounded-full h-4 shadow-inner-lg backdrop-blur-sm">
                <div
                  className="bg-gradient-progress h-4 rounded-full transition-all duration-500 shadow-lg shadow-blue-500/50"
                  style={{ width: `${stats.overallProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-sm text-gray-400">
                <span>{stats.completedQuantity.toLocaleString()}</span>
                <span>/</span>
                <span>{stats.totalQuantity.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl border border-slate-700/50 p-6 shadow-multi hover:shadow-glow-blue transition-all duration-300 animate-slide-up" style={{ animationDelay: '500ms' }}>
            <h2 className="text-xl font-black text-white mb-4 text-shadow-lg">Distribución por Prioridad</h2>
            <div className="space-y-3">
              {Object.entries(stats.priorityDistribution).map(([priority, count]) => {
                const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                const colorClass = PRIORITY_COLORS[priority as Priority] || PRIORITY_COLORS.normal
                const [textColor] = colorClass.split(' ')
                const bgColor = textColor ? textColor.replace('text-', 'bg-') : 'bg-blue-500'

                return (
                  <div key={priority}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold capitalize text-gray-300">{priority}</span>
                      <span className={`text-sm font-bold ${textColor || 'text-blue-400'} text-shadow`}>
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-700/70 rounded-full h-2.5 shadow-inner-lg backdrop-blur-sm">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${bgColor} shadow-lg`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="glass rounded-xl border border-slate-700/50 p-6 shadow-multi hover:shadow-glow-blue transition-all duration-300 animate-slide-up" style={{ animationDelay: '600ms' }}>
          <h2 className="text-xl font-black text-white mb-4 text-shadow-lg">Estadísticas por Compañía</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-300">Compañía</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-300">Total</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-300">En Producción</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-300">Completadas</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-300">En Hold</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.companyStats)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([company, companyStats]) => (
                    <tr key={company} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors duration-200">
                      <td className="px-4 py-3 text-white font-medium">{company}</td>
                      <td className="px-4 py-3 text-white">{companyStats.total}</td>
                      <td className="px-4 py-3 text-yellow-400 font-semibold">{companyStats.inProduction}</td>
                      <td className="px-4 py-3 text-green-400 font-semibold">{companyStats.completed}</td>
                      <td className="px-4 py-3 text-red-400 font-semibold">{companyStats.onHold}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass rounded-xl border border-slate-700/50 p-6 shadow-multi hover:shadow-glow-blue transition-all duration-300 animate-slide-up" style={{ animationDelay: '700ms' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-white text-shadow-lg">Gráficos de Análisis</h2>
            <div className="flex items-center gap-4">
              {(activeChart === 'line' || activeChart === 'area') && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                    className="bg-slate-800/50 border border-slate-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Desde"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                    className="bg-slate-800/50 border border-slate-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Hasta"
                  />
                  {(dateRange.start || dateRange.end) && (
                    <button
                      onClick={() => setDateRange({ start: '', end: '' })}
                      className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-slate-700/50 transition-colors"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            <button
              onClick={() => setActiveChart('line')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                activeChart === 'line'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
              }`}
            >
              Evolución Temporal
            </button>
            <button
              onClick={() => setActiveChart('bar')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                activeChart === 'bar'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
              }`}
            >
              Por Compañía
            </button>
            <button
              onClick={() => setActiveChart('pie')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                activeChart === 'pie'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
              }`}
            >
              Distribución Estados
            </button>
            <button
              onClick={() => setActiveChart('area')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                activeChart === 'area'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
              }`}
            >
              Progreso Acumulado
            </button>
            <button
              onClick={() => setActiveChart('combined')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                activeChart === 'combined'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
              }`}
            >
              Vista Combinada
            </button>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
            <Suspense fallback={<div className="h-64 flex items-center justify-center text-gray-400">Cargando gráfico...</div>}>
              {activeChart === 'line' && <LineChart workOrders={workOrders} dateRange={dateRange.start && dateRange.end ? dateRange : undefined} />}
              {activeChart === 'bar' && <BarChart workOrders={workOrders} />}
              {activeChart === 'pie' && <PieChart workOrders={workOrders} />}
              {activeChart === 'area' && <AreaChart workOrders={workOrders} dateRange={dateRange.start && dateRange.end ? dateRange : undefined} />}
              {activeChart === 'combined' && <CombinedChart workOrders={workOrders} />}
            </Suspense>
          </div>
        </div>
        </div>
      </main>
    </div>
  )
}
