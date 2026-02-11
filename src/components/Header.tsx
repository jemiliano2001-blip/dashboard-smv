import { memo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Menu, Wifi, WifiOff } from 'lucide-react'
import { useFullscreen } from '../hooks/useFullscreen'

interface CompanySummary {
  totalOrders: number
  criticalCount: number
  overallProgress: number
}

interface HeaderProps {
  companyName: string | null
  pageLabel?: string | null
  rotationProgress?: number
  companyIndex?: number
  totalCompanies?: number
  companySummary?: CompanySummary
  isOnline?: boolean
}

function HeaderClock() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  return (
    <div className="text-right flex-shrink-0">
      <div className="flex items-center gap-2 justify-end">
        <Clock className="w-5 h-5 text-blue-400 drop-shadow-lg" aria-hidden />
        <span className="text-2xl font-bold font-mono text-white text-shadow tracking-tight">
          {formatTime(currentTime)}
        </span>
      </div>
      <div className="text-xs text-blue-300/80 uppercase tracking-wider mt-0.5">
        {formatDate(currentTime)}
      </div>
    </div>
  )
}

function RotationProgressBar({ progress }: { progress: number }) {
  // Color transitions: blue at start → orange in middle → red near end
  const getBarColor = (p: number): string => {
    if (p > 50) return 'bg-blue-500'
    if (p > 20) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-800/50">
      <div
        className={`rotation-progress-bar ${getBarColor(progress)} opacity-80`}
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

function ConnectionIndicator({ isOnline }: { isOnline: boolean }) {
  if (isOnline) {
    return (
      <div className="flex items-center gap-1.5" title="Conectado">
        <span className="status-dot-pulse bg-green-400" />
        <Wifi className="w-3.5 h-3.5 text-green-400/70" aria-hidden />
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5" title="Sin conexión">
      <span className="status-dot-pulse bg-amber-400" />
      <WifiOff className="w-3.5 h-3.5 text-amber-400" aria-hidden />
    </div>
  )
}

function HeaderComponent({
  companyName,
  pageLabel,
  rotationProgress = 100,
  companyIndex = 0,
  totalCompanies = 0,
  companySummary,
  isOnline = true,
}: HeaderProps) {
  const { toggleFullscreen } = useFullscreen()

  return (
    <header className="flex-shrink-0 relative z-20">
      {/* Main header bar */}
      <div className="bg-[#0a0e17]/95 glass-strong border-b border-blue-900/30 flex items-center justify-between px-6 py-3 backdrop-blur-xl">
        {/* Left: Company name + summary */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleFullscreen}
              className="text-4xl font-black tracking-tight text-white cursor-pointer bg-transparent border-0 p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
              aria-label={`${companyName || 'Visual Factory Dashboard'} - Activar/desactivar pantalla completa`}
              title="Click para pantalla completa"
            >
              {companyName || 'Visual Factory Dashboard'}
            </button>
            {pageLabel && (
              <span className="flex-shrink-0 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-sm font-semibold tracking-wide">
                {pageLabel}
              </span>
            )}
          </div>
          {/* Company summary line */}
          {companySummary && (
            <div className="flex items-center gap-3 mt-1 text-sm">
              <span className="text-slate-400">
                <span className="text-white font-semibold">{companySummary.totalOrders}</span> órdenes
              </span>
              {companySummary.criticalCount > 0 && (
                <span className="text-red-400 font-medium">
                  {companySummary.criticalCount} crítica{companySummary.criticalCount !== 1 ? 's' : ''}
                </span>
              )}
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">
                <span className="text-emerald-400 font-semibold">{companySummary.overallProgress}%</span> progreso
              </span>
            </div>
          )}
        </div>

        {/* Right: Company context + Clock + Connection + Menu */}
        <div className="flex items-center gap-5 flex-shrink-0">
          {/* Company context indicator */}
          {totalCompanies > 1 && (
            <div className="text-center">
              <div className="text-lg font-bold text-white">
                {companyIndex + 1}
                <span className="text-slate-500 font-normal text-sm"> de </span>
                {totalCompanies}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">empresas</div>
            </div>
          )}

          {/* Separator */}
          {totalCompanies > 1 && (
            <div className="w-px h-10 bg-blue-900/40" />
          )}

          <ConnectionIndicator isOnline={isOnline} />

          <Link
            to="/admin"
            className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white text-sm font-medium rounded-lg hover:bg-white/5 transition-colors duration-200 border border-transparent hover:border-white/10"
            aria-label="Abrir menú de administración"
            title="Menú"
          >
            <Menu className="w-5 h-5" />
          </Link>

          <HeaderClock />
        </div>
      </div>

      {/* Rotation progress bar at bottom of header */}
      <RotationProgressBar progress={rotationProgress} />
    </header>
  )
}

export const Header = memo(HeaderComponent)
