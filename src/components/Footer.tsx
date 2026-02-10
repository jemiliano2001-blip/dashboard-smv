import { memo, useMemo } from 'react'
import { Package, Cog, CheckCircle, AlertCircle, type LucideIcon } from 'lucide-react'
import type { WorkOrder } from '../types'

interface FooterProps {
  workOrders: WorkOrder[]
}

interface KPI {
  label: string
  value: number
  icon: LucideIcon
  color: string
}

function FooterComponent({ workOrders }: FooterProps) {
  const kpis = useMemo((): KPI[] => {
    const totalOrders = workOrders.length
    const inProduction = workOrders.filter((o) => o.status === 'production').length
    const completed = workOrders.filter((o) => o.status === 'quality').length
    const onHold = workOrders.filter((o) => o.priority === 'critical').length

    return [
      { label: 'Total', value: totalOrders, icon: Package, color: 'text-blue-400' },
      { label: 'Producción', value: inProduction, icon: Cog, color: 'text-yellow-400' },
      { label: 'Completadas', value: completed, icon: CheckCircle, color: 'text-green-400' },
      { label: 'En Hold', value: onHold, icon: AlertCircle, color: 'text-red-400' },
    ]
  }, [workOrders])

  return (
    <footer className="flex-shrink-0 !bg-slate-900 glass-strong border-t border-slate-700/50 flex items-center justify-around px-8 py-4 shadow-multi relative z-20 backdrop-blur-xl">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon
        return (
          <div 
            key={kpi.label} 
            className="flex items-center gap-3 transition-all duration-300 hover:scale-110 cursor-default group animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <Icon className={`w-5 h-5 ${kpi.color} drop-shadow-lg transition-all duration-300 group-hover:scale-125 group-hover:drop-shadow-[0_0_8px_currentColor]`} />
            <div>
              <div className="text-lg font-black text-white text-shadow transition-all duration-300 group-hover:scale-105">{kpi.value}</div>
              <div className="text-xs text-blue-300 uppercase tracking-wide transition-opacity duration-300 group-hover:text-blue-200">{kpi.label}</div>
            </div>
          </div>
        )
      })}
    </footer>
  )
}

export const Footer = memo(FooterComponent, (prevProps, nextProps) => {
  return prevProps.workOrders.length === nextProps.workOrders.length &&
    prevProps.workOrders.every((order, index) => order.id === nextProps.workOrders[index]?.id)
})
