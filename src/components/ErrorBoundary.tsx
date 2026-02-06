import { Component, ReactNode, ErrorInfo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { logger } from '../utils/logger'

interface ErrorBoundaryProps {
  children: ReactNode
  showDetails?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  retryCount: number
}

/**
 * Error Boundary component to catch React errors
 * and display a fallback UI instead of crashing the app.
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Detailed error information in development
 * - Recovery mechanism to reset error state
 * 
 * @param children - React children to render
 * @param showDetails - Whether to show error details (default: false, true in development)
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static defaultProps = {
    showDetails: false,
  }

  private retryTimeoutId: NodeJS.Timeout | null = null
  private readonly MAX_RETRIES = 3
  private readonly INITIAL_RETRY_DELAY = 1000

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null, retryCount: 0 }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('React Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack,
      feature: 'error-boundary',
      action: 'catch_error',
    })

    this.setState((prevState) => ({
      error,
      errorInfo,
      retryCount: prevState.retryCount + 1,
    }))

    // Attempt automatic recovery after delay
    if (this.state.retryCount < this.MAX_RETRIES) {
      const delay = this.INITIAL_RETRY_DELAY * Math.pow(2, this.state.retryCount)
      this.retryTimeoutId = setTimeout(() => {
        this.handleRetry()
      }, delay)
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-zinc-900 border-2 border-red-500 rounded-lg p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-black text-zinc-100 mb-4">Algo salió mal</h1>
            <p className="text-zinc-300 dark:text-zinc-400 mb-6">
              Ha ocurrido un error inesperado en la aplicación. Por favor, recarga la página.
            </p>

            {this.props.showDetails && this.state.error && (
              <details className="mt-6 text-left bg-zinc-900 rounded p-4 mb-6">
                <summary className="cursor-pointer text-red-400 font-bold mb-2">
                  Detalles del error
                </summary>
                <pre className="text-xs text-zinc-300 dark:text-zinc-400 overflow-auto max-h-64">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-4 justify-center">
              {this.state.retryCount < this.MAX_RETRIES && (
                <button
                  onClick={this.handleRetry}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
                >
                  Intentar de Nuevo
                </button>
              )}
              <button
                onClick={this.handleReload}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
              >
                Recargar Página
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Default props handled in component
