import { memo, useMemo } from 'react'
import { Package, Cog, CheckCircle, AlertCircle, type LucideIcon } from 'lucide-react'
import type { WorkOrder } from '../types'

interface FooterProps {
  workOrders: WorkOrder[]
  currentCompanyOrders?: WorkOrder[]
  companyIndex?: number
  totalCompanies?: number
}

interface KPI {
  label: string
  value: number
  icon: LucideIcon
  color: string
  iconColor: string
}

function CompanyDots({
  companyIndex,
  totalCompanies,
}: {
  companyIndex: number
  totalCompanies: number
}) {
  if (totalCompanies <= 1) return null

  // If too many companies, show a condensed version
  const maxDots = 12
  const showCondensed = totalCompanies > maxDots

  if (showCondensed) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-slate-500 font-medium tabular-nums">
          {companyIndex + 1}/{totalCompanies}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: totalCompanies }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-400 ${
            i === companyIndex
              ? 'company-dot company-dot-active'
              : 'company-dot'
          }`}
        />
      ))}
    </div>
  )
}

function FooterComponent({
  workOrders,
  currentCompanyOrders,
  companyIndex = 0,
  totalCompanies = 0,
}: FooterProps) {
  // Use currentCompanyOrders if provided, otherwise fall back to all workOrders
  const ordersForKPIs = currentCompanyOrders ?? workOrders

  const kpis = useMemo((): KPI[] => {
    const totalOrders = ordersForKPIs.length
    const inProduction = ordersForKPIs.filter((o) => o.status === 'production').length
    const completed = ordersForKPIs.filter((o) => o.status === 'quality').length
    const onHold = ordersForKPIs.filter((o) => o.priority === 'critical' || o.status === 'hold').length

    return [
      { label: 'Total', value: totalOrders, icon: Package, color: 'text-blue-400', iconColor: 'text-blue-400' },
      { label: 'Producción', value: inProduction, icon: Cog, color: 'text-amber-400', iconColor: 'text-amber-400' },
      { label: 'Calidad', value: completed, icon: CheckCircle, color: 'text-emerald-400', iconColor: 'text-emerald-400' },
      { label: 'En Hold', value: onHold, icon: AlertCircle, color: 'text-red-400', iconColor: 'text-red-400' },
    ]
  }, [ordersForKPIs])

  const isShowingCompanyData = !!currentCompanyOrders

  return (
    <footer className="flex-shrink-0 bg-[#0a0e17]/95 glass-strong border-t border-blue-900/30 relative z-20 backdrop-blur-xl">
      {/* Main KPI row */}
      <div className="flex items-center justify-between px-6 py-3">
        {/* KPIs */}
        <div className="flex items-center gap-0 flex-1">
          {kpis.map((kpi, index) => {
            const Icon = kpi.icon
            return (
              <div key={kpi.label} className="flex items-center">
                {index > 0 && (
                  <div className="w-px h-8 bg-blue-900/40 mx-4" />
                )}
                <div
                  className="flex items-center gap-2.5 cursor-default group"
                >
                  <Icon className={`w-5 h-5 ${kpi.iconColor} drop-shadow-lg flex-shrink-0 transition-transform duration-300 group-hover:scale-110`} aria-hidden />
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-white tabular-nums leading-none">
                      {kpi.value}
                    </span>
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                      {kpi.label}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right side: Company dots + context label */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {isShowingCompanyData && (
            <span className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">
              empresa actual
            </span>
          )}
          <CompanyDots companyIndex={companyIndex} totalCompanies={totalCompanies} />
        </div>
      </div>
    </footer>
  )
}

export const Footer = memo(FooterComponent, (prevProps, nextProps) => {
  // Shallow compare workOrders length and ids
  if (prevProps.workOrders.length !== nextProps.workOrders.length) return false
  if (prevProps.companyIndex !== nextProps.companyIndex) return false
  if (prevProps.totalCompanies !== nextProps.totalCompanies) return false

  // Compare currentCompanyOrders
  const prevCO = prevProps.currentCompanyOrders
  const nextCO = nextProps.currentCompanyOrders
  if (prevCO?.length !== nextCO?.length) return false
  if (prevCO && nextCO && !prevCO.every((o, i) => o.id === nextCO[i]?.id)) return false

  return prevProps.workOrders.every((order, index) => order.id === nextProps.workOrders[index]?.id)
})
