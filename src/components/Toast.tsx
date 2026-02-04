import { useEffect } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { TOAST_TYPES, type Toast } from '../hooks/useToast'

const ICON_MAP = {
  [TOAST_TYPES.SUCCESS]: CheckCircle,
  [TOAST_TYPES.ERROR]: AlertCircle,
  [TOAST_TYPES.WARNING]: AlertTriangle,
  [TOAST_TYPES.INFO]: Info,
}

const COLOR_MAP: Record<string, string> = {
  [TOAST_TYPES.SUCCESS]: 'bg-green-500/20 border-green-500 text-green-400',
  [TOAST_TYPES.ERROR]: 'bg-red-500/20 border-red-500 text-red-400',
  [TOAST_TYPES.WARNING]: 'bg-yellow-500/20 border-yellow-500 text-yellow-400',
  [TOAST_TYPES.INFO]: 'bg-blue-500/20 border-blue-500 text-blue-400',
}

interface ToastProps {
  toast: Toast
  onRemove: (id: number) => void
}

/**
 * Toast notification component
 */
export function Toast({ toast, onRemove }: ToastProps) {
  const Icon = ICON_MAP[toast.type] || Info
  const colorClass = COLOR_MAP[toast.type] || COLOR_MAP[TOAST_TYPES.INFO]

  useEffect(() => {
    if (toast.duration > 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id)
      }, toast.duration)

      return () => clearTimeout(timer)
    }
    return undefined
  }, [toast.id, toast.duration, onRemove])

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border-2 shadow-lg
        animate-in slide-in-from-right-full duration-300
        ${colorClass}
      `}
      role="alert"
      aria-live="polite"
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity"
        aria-label="Cerrar notificación"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: number) => void
}

/**
 * Toast container component
 */
export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full"
      aria-live="assertive"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}
