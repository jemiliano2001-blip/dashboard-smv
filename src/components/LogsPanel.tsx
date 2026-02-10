import { useState, useEffect, useRef, useMemo } from 'react'
import { FileText, Search, Download, Filter, X, AlertCircle, Info, AlertTriangle, XCircle } from 'lucide-react'
import { ConfirmDialog } from './ConfirmDialog'

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface SystemLog {
  id: string
  level: LogLevel
  message: string
  timestamp: string
  feature?: string
  action?: string
  error?: {
    name: string
    message: string
    stack?: string
  }
  [key: string]: unknown
}

const STORAGE_KEY = 'system-logs'
const MAX_LOGS = 1000

const createLogFromEvent = (event: Event): SystemLog | null => {
  try {
    const customEvent = event as CustomEvent
    const detail = customEvent.detail

    return {
      id: `${Date.now()}-${Math.random()}`,
      level: (detail?.level as LogLevel) || 'info',
      message: detail?.message || 'Unknown log entry',
      timestamp: new Date().toISOString(),
      feature: detail?.feature,
      action: detail?.action,
      error: detail?.error,
      ...detail,
    }
  } catch {
    return null
  }
}

export function LogsPanel({ className = '' }: { className?: string }) {
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SystemLog[]
        setLogs(parsed.slice(-MAX_LOGS))
      } catch {
        setLogs([])
      }
    }

    const handleLogEvent = (event: Event) => {
      const log = createLogFromEvent(event)
      if (log) {
        setLogs((prev) => {
          const updated = [...prev, log].slice(-MAX_LOGS)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
          return updated
        })
      }
    }

    window.addEventListener('system-log', handleLogEvent as EventListener)
    return () => {
      window.removeEventListener('system-log', handleLogEvent as EventListener)
    }
  }, [])

  useEffect(() => {
    if (!autoRefresh) return () => {}
    const interval = setInterval(() => {
        setLogs((prev) => {
          const saved = localStorage.getItem(STORAGE_KEY)
          if (saved) {
            try {
              const parsed = JSON.parse(saved) as SystemLog[]
              return parsed.slice(-MAX_LOGS)
            } catch {
              return prev
            }
          }
          return prev
        })
    }, 2000)
    return () => clearInterval(interval)
  }, [autoRefresh])

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        !searchTerm ||
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.feature?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesLevel = levelFilter === 'all' || log.level === levelFilter

      return matchesSearch && matchesLevel
    })
  }, [logs, searchTerm, levelFilter])

  const handleExport = () => {
    const exportData = filteredLogs.map((log) => ({
      Timestamp: new Date(log.timestamp).toLocaleString('es-ES'),
      Level: log.level.toUpperCase(),
      Message: log.message,
      Feature: log.feature || '',
      Action: log.action || '',
      Error: log.error ? `${log.error.name}: ${log.error.message}` : '',
    }))

    const csv = [
      Object.keys(exportData[0] || {}).join(','),
      ...exportData.map((row) => Object.values(row).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `system-logs-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleClear = () => {
    setConfirmClear(true)
  }

  const handleConfirmClear = () => {
    setLogs([])
    localStorage.removeItem(STORAGE_KEY)
    setConfirmClear(false)
  }

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />
      case 'warn':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case 'info':
        return <Info className="w-4 h-4 text-blue-400" />
      case 'debug':
        return <AlertCircle className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
      default:
        return <Info className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
    }
  }

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'error':
        return 'bg-red-500/10 border-red-500/50'
      case 'warn':
        return 'bg-yellow-500/10 border-yellow-500/50'
      case 'info':
        return 'bg-blue-500/10 border-blue-500/50'
      case 'debug':
        return 'bg-gray-500/10 border-gray-500/50'
      default:
        return 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-600'
    }
  }

  return (
    <div className={`bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6 h-full flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Logs del Sistema</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Registros de actividad del sistema</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-blue-600"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">Auto-refresh</span>
          </label>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors text-sm"
            title="Exportar logs"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors text-sm"
            title="Limpiar logs"
          >
            <X className="w-4 h-4" />
            Limpiar
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar en logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as LogLevel | 'all')}
            className="pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="all">Todos los niveles</option>
            <option value="error">Error</option>
            <option value="warn">Warning</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 font-mono text-sm">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-bold mb-2">No hay logs disponibles</p>
            <p className="text-sm">
              Los logs del sistema aparecerán aquí cuando haya actividad
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded-lg border ${getLevelColor(log.level)} transition-colors`}
              >
                <div className="flex items-start gap-3">
                  {getLevelIcon(log.level)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold">
                        {new Date(log.timestamp).toLocaleString('es-ES')}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 uppercase font-bold">
                        {log.level}
                      </span>
                      {log.feature && (
                        <span className="text-xs px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                          {log.feature}
                        </span>
                      )}
                      {log.action && (
                        <span className="text-xs px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                          {log.action}
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-900 dark:text-zinc-100 mb-1 break-words">{log.message}</p>
                    {log.error && (
                      <div className="mt-2 p-2 bg-zinc-200 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
                        <p className="text-red-600 dark:text-red-400 font-bold text-xs mb-1">{log.error.name}</p>
                        <p className="text-red-500 dark:text-red-300 text-xs mb-1">{log.error.message}</p>
                        {log.error.stack && (
                          <pre className="text-xs text-zinc-500 dark:text-zinc-400 overflow-x-auto whitespace-pre-wrap">
                            {log.error.stack}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-400 text-center">
        Mostrando {filteredLogs.length} de {logs.length} logs
        {autoRefresh && <span className="ml-2 text-green-400">• Auto-refresh activo</span>}
      </div>

      <ConfirmDialog
        isOpen={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={handleConfirmClear}
        title="Limpiar Logs"
        message="¿Estás seguro de que deseas limpiar todos los logs?"
        confirmText="Limpiar"
        cancelText="Cancelar"
        variant="warning"
      />
    </div>
  )
}
