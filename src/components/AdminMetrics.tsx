import { useMemo, memo } from 'react'
import { BarChart3, TrendingUp, Clock, AlertTriangle } from 'lucide-react'
import type { WorkOrder } from '../types'
import { PRIORITY_COLORS } from '../utils/constants'

interface AdminMetricsProps {
  orders: WorkOrder[]
}

export const AdminMetrics = memo(function AdminMetrics({ orders }: AdminMetricsProps) {
  const metrics = useMemo(() => {
    const total = orders.length
    const byStatus = orders.reduce(
      (acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
    const byPriority = orders.reduce(
      (acc, order) => {
        acc[order.priority] = (acc[order.priority] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const totalQuantity = orders.reduce((sum, order) => sum + order.quantity_total, 0)
    const completedQuantity = orders.reduce((sum, order) => sum + order.quantity_completed, 0)
    const overallProgress = totalQuantity > 0 ? Math.round((completedQuantity / totalQuantity) * 100) : 0

    const inProduction = byStatus.production || 0
    const critical = byPriority.critical || 0
    const highPriority = byPriority.high || 0
    const urgent = critical + highPriority

    return {
      total,
      byStatus,
      byPriority,
      overallProgress,
      inProduction,
      urgent,
      totalQuantity,
      completedQuantity,
    }
  }, [orders])

  const statusLabels: Record<string, string> = {
    scheduled: 'Programada',
    production: 'En Producción',
    quality: 'Calidad',
    hold: 'En Hold',
  }

  const priorityLabels: Record<string, string> = {
    low: 'Baja',
    normal: 'Normal',
    high: 'Alta',
    critical: 'Crítica',
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Metric Cards */}
      <div className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 cursor-default border border-white/10 hover:border-white/20">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors duration-300">
            <BarChart3 className="w-6 h-6 text-blue-400" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-bold text-white tracking-tight">{metrics.total}</p>
          <p className="text-sm text-gray-400 font-medium">Total de Órdenes</p>
        </div>
      </div>

      <div className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 cursor-default border border-white/10 hover:border-white/20">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors duration-300">
            <TrendingUp className="w-6 h-6 text-green-400" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-bold text-white tracking-tight">{metrics.overallProgress}%</p>
          <p className="text-sm text-gray-400 font-medium">Progreso General</p>
          <p className="text-xs text-gray-500 mt-2">
            {metrics.completedQuantity.toLocaleString()} / {metrics.totalQuantity.toLocaleString()} unidades
          </p>
        </div>
      </div>

      <div className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 cursor-default border border-white/10 hover:border-white/20">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-orange-500/20 rounded-xl group-hover:bg-orange-500/30 transition-colors duration-300">
            <Clock className="w-6 h-6 text-orange-400" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-bold text-white tracking-tight">{metrics.inProduction}</p>
          <p className="text-sm text-gray-400 font-medium">En Producción</p>
        </div>
      </div>

      <div className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 cursor-default border border-white/10 hover:border-white/20">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-red-500/20 rounded-xl group-hover:bg-red-500/30 transition-colors duration-300">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-bold text-white tracking-tight">{metrics.urgent}</p>
          <p className="text-sm text-gray-400 font-medium">Urgentes</p>
          <p className="text-xs text-gray-500 mt-2">
            {metrics.byPriority.critical || 0} crítica{metrics.byPriority.critical === 1 ? '' : 's'}, {metrics.byPriority.high || 0} alta{metrics.byPriority.high === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Distribution Cards */}
      <div className="md:col-span-2 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h3 className="text-xs font-semibold text-gray-400 mb-6 uppercase tracking-wider">Distribución por Estado</h3>
        <div className="space-y-4">
          {Object.entries(metrics.byStatus).map(([status, count]) => {
            const percentage = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0
            return (
              <div key={status} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">{statusLabels[status] || status}</span>
                  <span className="text-sm font-semibold text-white">{count} <span className="text-gray-400">({percentage}%)</span></span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="md:col-span-2 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h3 className="text-xs font-semibold text-gray-400 mb-6 uppercase tracking-wider">Distribución por Prioridad</h3>
        <div className="space-y-4">
          {(['critical', 'high', 'normal', 'low'] as const).map((priority) => {
            const count = metrics.byPriority[priority] || 0
            const percentage = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0
            
            const priorityColorMap: Record<string, string> = {
              critical: 'bg-red-500',
              high: 'bg-orange-500',
              normal: 'bg-blue-500',
              low: 'bg-gray-500',
            }
            const bgColorClass = priorityColorMap[priority] || 'bg-gray-500'

            return (
              <div key={priority} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">{priorityLabels[priority] || priority}</span>
                  <span className="text-sm font-semibold text-white">{count} <span className="text-gray-400">({percentage}%)</span></span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`${bgColorClass} h-1.5 rounded-full transition-all duration-500 ease-out`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})
