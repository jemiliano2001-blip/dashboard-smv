import { useMemo, useState, lazy, Suspense } from 'react'
import { useWorkOrders } from '@/features/orders'
import { PageHeader } from '../layouts/PageHeader'
import { TrendingUp, Package, Clock, CheckCircle, AlertTriangle, Calendar } from 'lucide-react'
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
      <header className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 md:px-8 py-4 md:py-6 flex-shrink-0 shadow-sm">
        <PageHeader
          title="Dashboard de Estadísticas"
          description="Análisis y métricas de las órdenes de trabajo"
          breadcrumbs={STATS_BREADCRUMBS}
        />
      </header>
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-[1920px] mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 auto-rows-[minmax(120px,auto)]">
            <div className="col-span-2 row-span-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <Package className="w-8 h-8 text-blue-500" />
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-1 font-mono">{stats.total}</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">Total de Órdenes</div>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 shadow-sm hover:shadow-md transition-all">
              <Clock className="w-6 h-6 text-amber-500 mb-2" />
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">{stats.inProduction}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">En Producción</div>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 shadow-sm hover:shadow-md transition-all">
              <CheckCircle className="w-6 h-6 text-green-500 mb-2" />
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">{stats.completed}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Completadas</div>
            </div>

            <div className="col-span-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
                <div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">{stats.onHold}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">En Hold</div>
                </div>
              </div>
            </div>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Progreso General</h2>
            <div className="mb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-600 dark:text-zinc-300">Progreso Total</span>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400 font-mono">{stats.overallProgress}%</span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-4">
                <div
                  className="bg-gradient-progress h-4 rounded-full transition-all duration-500 shadow-lg shadow-blue-500/50"
                  style={{ width: `${stats.overallProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                <span>{stats.completedQuantity.toLocaleString()}</span>
                <span>/</span>
                <span>{stats.totalQuantity.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Distribución por Prioridad</h2>
            <div className="space-y-3">
              {Object.entries(stats.priorityDistribution).map(([priority, count]) => {
                const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                const colorClass = PRIORITY_COLORS[priority as Priority] || PRIORITY_COLORS.normal
                const [textColor] = colorClass.split(' ')
                const bgColor = textColor ? textColor.replace('text-', 'bg-') : 'bg-blue-500'

                return (
                  <div key={priority}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium capitalize text-zinc-600 dark:text-zinc-300">{priority}</span>
                      <span className={`text-sm font-bold ${textColor || 'text-blue-400'} text-shadow`}>
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2.5">
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

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Estadísticas por Compañía</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">Compañía</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">Total</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">En Producción</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">Completadas</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">En Hold</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.companyStats)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([company, companyStats]) => (
                    <tr key={company} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100 font-medium">{company}</td>
                      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 font-mono">{companyStats.total}</td>
                      <td className="px-4 py-3 text-amber-600 dark:text-amber-400 font-medium font-mono">{companyStats.inProduction}</td>
                      <td className="px-4 py-3 text-green-600 dark:text-green-400 font-medium font-mono">{companyStats.completed}</td>
                      <td className="px-4 py-3 text-red-600 dark:text-red-400 font-medium font-mono">{companyStats.onHold}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Gráficos de Análisis</h2>
            <div className="flex items-center gap-4">
              {(activeChart === 'line' || activeChart === 'area') && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-zinc-500" />
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                    className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Desde"
                  />
                    <span className="text-zinc-400">-</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                    className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Hasta"
                  />
                  {(dateRange.start || dateRange.end) && (
                    <button
                      onClick={() => setDateRange({ start: '', end: '' })}
                      className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors"
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
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              Evolución Temporal
            </button>
            <button
              onClick={() => setActiveChart('bar')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                activeChart === 'bar'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              Por Compañía
            </button>
            <button
              onClick={() => setActiveChart('pie')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                activeChart === 'pie'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              Distribución Estados
            </button>
            <button
              onClick={() => setActiveChart('area')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                activeChart === 'area'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              Progreso Acumulado
            </button>
            <button
              onClick={() => setActiveChart('combined')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                activeChart === 'combined'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              Vista Combinada
            </button>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
            <Suspense fallback={<div className="h-64 flex items-center justify-center text-zinc-500">Cargando gráfico...</div>}>
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
