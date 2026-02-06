import { memo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Menu } from 'lucide-react'
import { useFullscreen } from '../hooks/useFullscreen'

interface HeaderProps {
  companyName: string | null
  pageLabel?: string | null
}

function HeaderComponent({ companyName, pageLabel }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const { toggleFullscreen } = useFullscreen()

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
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <header className="h-16 flex-shrink-0 !bg-slate-900 glass-strong border-b border-slate-700/50 flex items-center justify-between px-8 shadow-multi relative z-20 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="relative flex items-baseline gap-3">
          <h1 className="text-5xl font-black tracking-tight text-white text-shadow-lg transition-opacity duration-300">
            {companyName || 'Visual Factory Dashboard'}
          </h1>
          {pageLabel && (
            <span className="text-sm text-blue-300 font-medium" aria-label={pageLabel}>
              {pageLabel}
            </span>
          )}
          <button
            onClick={toggleFullscreen}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
            aria-label="Activar/desactivar pantalla completa"
            title="Click en el título para activar pantalla completa"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Link
          to="/admin"
          className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white text-sm font-medium rounded-lg hover:bg-white/5 transition-colors duration-200 border border-transparent hover:border-white/10"
          aria-label="Abrir menú de administración"
          title="Menú"
        >
          <Menu className="w-5 h-5" />
          <span className="hidden sm:inline">Menú</span>
        </Link>
        <div className="text-right">
          <div className="flex items-center gap-2 text-blue-400">
            <Clock className="w-5 h-5 drop-shadow-lg animate-float" />
            <span className="text-xl font-bold text-white text-shadow transition-all duration-300">{formatTime(currentTime)}</span>
          </div>
          <div className="text-xs text-blue-300 uppercase tracking-wide transition-opacity duration-300">
            {formatDate(currentTime)}
          </div>
        </div>
      </div>
    </header>
  )
}

export const Header = memo(HeaderComponent)
