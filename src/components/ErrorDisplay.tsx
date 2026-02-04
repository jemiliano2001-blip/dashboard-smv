import { AlertCircle, RefreshCw, X } from 'lucide-react'
import { getErrorMessage, getErrorSuggestions } from '../utils/errorMessages'

interface ErrorDisplayProps {
  error: Error | string | null | undefined
  onRetry?: () => void
  onDismiss?: () => void
  context?: {
    code?: string
    action?: string
  }
  className?: string
}

export function ErrorDisplay({ error, onRetry, onDismiss, context, className = '' }: ErrorDisplayProps) {
  if (!error) return null

  const message = getErrorMessage(error, context)
  const suggestions = getErrorSuggestions(error)

  return (
    <div className={`bg-red-500/20 border-2 border-red-500 rounded-lg p-4 ${className}`} role="alert">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-red-400 font-bold mb-2">Error</h3>
          <p className="text-gray-300 mb-3">{message}</p>
          
          {suggestions.length > 0 && (
            <div className="mb-3">
              <p className="text-sm text-gray-400 mb-2">Sugerencias:</p>
              <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                {suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors text-sm"
                aria-label="Reintentar"
              >
                <RefreshCw className="w-4 h-4" />
                Reintentar
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors text-sm"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
