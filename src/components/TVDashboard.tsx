import { useState, useEffect, useMemo } from 'react'
import { RefreshCw, WifiOff } from 'lucide-react'
import { useWorkOrders } from '@/features/orders'
import { useFullscreen } from '../hooks/useFullscreen'
import { useTVPageRotation } from '../hooks/useTVPageRotation'
import { useSettings } from '../hooks/useSettings'
import { Header } from './Header'
import { Footer } from './Footer'
import { OrderCard } from './OrderCard'
import { SkeletonCard } from './SkeletonCard'
import { weightedSort } from '../utils/weightedSort'
import type { WorkOrder } from '../types'

export function TVDashboard() {
  const { workOrders, ordersByCompany, companies, loading, error, refetch } = useWorkOrders()
  const { enterFullscreen } = useFullscreen()
  const settings = useSettings()
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const tvGridColumns =
    settings.columnDensity === 'auto'
      ? 5
      : Number(settings.columnDensity) || 5
  const ordersPerPage = settings.ordersPerPage ?? 8
  const rowsPerScreen = Math.max(1, Math.ceil(ordersPerPage / tvGridColumns))
  const itemsPerPage = tvGridColumns * rowsPerScreen

  const sortedOrdersByCompany = useMemo(() => {
    const out: Record<string, WorkOrder[]> = {}
    for (const company of companies) {
      out[company] = weightedSort(ordersByCompany[company] ?? [], {
        prioritizeOldOrders: settings.prioritizeOldOrders ?? false,
        groupBySize: settings.groupBySize ?? false,
      })
    }
    return out
  }, [companies, ordersByCompany, settings.prioritizeOldOrders, settings.groupBySize])

  const {
    currentCompany,
    currentItems,
    currentPage,
    totalPages,
    progress,
    companyIndex,
    totalCompanies,
  } = useTVPageRotation({
    items: sortedOrdersByCompany,
    companies,
    rotationInterval: (settings.companyRotation ?? 30) * 1000,
    pageRotationInterval: (settings.pageRotation ?? 15) * 1000,
    itemsPerPage,
  })

  const fitToScreen = settings.fitToScreen ?? true
  const gridAutoRows = fitToScreen ? 'minmax(0, 1fr)' : 'minmax(96px, 1fr)'

  // Compute company summary for the Header
  const companySummary = useMemo(() => {
    if (!currentCompany) return undefined
    const companyOrders = ordersByCompany[currentCompany] ?? []
    if (companyOrders.length === 0) return undefined

    const totalOrders = companyOrders.length
    const criticalCount = companyOrders.filter(
      (o) => o.priority === 'critical' || o.status === 'hold'
    ).length
    const totalQty = companyOrders.reduce((sum, o) => sum + (o.quantity_total || 0), 0)
    const completedQty = companyOrders.reduce((sum, o) => sum + (o.quantity_completed || 0), 0)
    const overallProgress = totalQty > 0 ? Math.round((completedQty / totalQty) * 100) : 0

    return { totalOrders, criticalCount, overallProgress }
  }, [currentCompany, ordersByCompany])

  // Current company orders for footer KPIs
  const currentCompanyOrders = useMemo(
    () => (currentCompany ? ordersByCompany[currentCompany] ?? [] : []),
    [currentCompany, ordersByCompany]
  )

  // Auto-refresco según configuración
  useEffect(() => {
    const intervalMinutes = settings.autoRefreshInterval ?? 5
    if (intervalMinutes > 0) {
      const intervalMs = intervalMinutes * 60 * 1000
      const timer = setInterval(() => {
        refetch()
      }, intervalMs)

      return () => clearInterval(timer)
    }
    return undefined
  }, [settings.autoRefreshInterval, refetch])

  if (loading) {
    return (
      <div className="h-screen w-full max-w-[100vw] flex flex-col overflow-hidden relative mesh-gradient-bg">
        <div className="h-16 flex-shrink-0 bg-[#0a0e17]/95 glass-strong border-b border-blue-900/30 relative z-20" />
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden p-[clamp(0.5rem,1.5vh,2rem)] relative z-10">
          <div
            className="grid gap-[clamp(4px,0.5vh,12px)] flex-1 min-h-0"
            style={{
              gridTemplateColumns: `repeat(${tvGridColumns}, 1fr)`,
              gridAutoRows: 'minmax(0, 1fr)',
            }}
          >
            {Array.from({ length: itemsPerPage }).map((_, i) => (
              <div key={i} className="min-w-0 min-h-0">
                <SkeletonCard index={i} />
              </div>
            ))}
          </div>
        </main>
        <div className="h-14 flex-shrink-0 bg-[#0a0e17]/95 glass-strong border-t border-blue-900/30 relative z-20" />
      </div>
    )
  }

  if (error || !isOnline) {
    const isOffline = !isOnline
    return (
      <div className="flex items-center justify-center h-screen relative mesh-gradient-bg">
        <div className="text-center glass rounded-2xl p-8 border border-red-500/30 shadow-multi relative z-10 max-w-lg">
          <div className="flex justify-center mb-4">
            <WifiOff className="w-12 h-12 text-red-400" aria-hidden />
          </div>
          <div className="text-red-400 text-xl font-bold mb-2 text-shadow-lg">
            {isOffline ? 'Sin conexión' : 'Error de Conexión'}
          </div>
          {isOffline ? (
            <div className="text-gray-300 mb-6">
              Comprueba tu conexión a internet y vuelve a intentar.
            </div>
          ) : (
            <div className="text-gray-300 mb-2">{typeof error === 'string' ? error : 'Error al cargar los datos'}</div>
          )}
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            aria-label="Reintentar conexión"
          >
            <RefreshCw className="w-5 h-5" aria-hidden />
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (companies.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen relative mesh-gradient-bg">
        <div className="text-center glass rounded-2xl p-8 border border-slate-700/50 shadow-multi relative z-10">
          <div className="text-gray-300 text-xl font-bold text-shadow-lg">No hay órdenes de trabajo</div>
          <div className="text-sm text-gray-400 mt-2">Esperando datos...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full max-w-[100vw] flex flex-col overflow-hidden relative mesh-gradient-bg">
      {!isOnline && (
        <div
          className="absolute top-0 left-0 right-0 z-30 flex items-center justify-center gap-2 py-2 bg-amber-600/90 text-white text-sm font-medium"
          role="alert"
          aria-live="polite"
        >
          <WifiOff className="w-4 h-4 shrink-0" aria-hidden />
          Sin conexión
        </div>
      )}
      <Header
        companyName={currentCompany}
        pageLabel={
          totalPages > 1 ? `Pág ${currentPage} de ${totalPages}` : null
        }
        rotationProgress={progress}
        companyIndex={companyIndex}
        totalCompanies={totalCompanies}
        companySummary={companySummary}
        isOnline={isOnline}
      />

      <main className="flex-1 min-h-0 flex flex-col overflow-hidden p-[clamp(0.5rem,1.5vh,2rem)] relative z-10">
        <div
          key={`${currentCompany ?? ''}-${currentPage}`}
          className={fitToScreen ? 'grid gap-[clamp(4px,0.5vh,12px)] flex-1 min-h-0 animate-fade-in-smooth' : 'flex-1 min-h-0 overflow-y-scroll'}
        >
          <div
            className="grid gap-[clamp(4px,0.5vh,12px)] animate-fade-in-smooth"
            style={{
              gridTemplateColumns: `repeat(${tvGridColumns}, 1fr)`,
              gridAutoRows: gridAutoRows,
            }}
          >
            {currentItems.map((order, index) => (
              <div
                key={order.id}
                className="min-w-0 min-h-0 animate-slide-up-smooth"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <OrderCard
                  order={order}
                  tvMode
                  textSize={settings.textSize ?? 'normal'}
                />
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer
        workOrders={workOrders}
        currentCompanyOrders={currentCompanyOrders}
        companyIndex={companyIndex}
        totalCompanies={totalCompanies}
      />

      <button
        onClick={enterFullscreen}
        className="absolute bottom-4 right-4 w-16 h-16 opacity-0 cursor-pointer z-50 border-0 bg-transparent shadow-none outline-none focus:outline-none focus:ring-0"
        aria-label="Activar pantalla completa"
        title="Click para activar pantalla completa"
        tabIndex={0}
      />
    </div>
  )
}
