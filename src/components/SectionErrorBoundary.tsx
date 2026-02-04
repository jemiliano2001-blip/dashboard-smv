import { Component, ReactNode, ErrorInfo } from 'react'
import { AlertCircle } from 'lucide-react'
import { logger } from '../utils/logger'

interface SectionErrorBoundaryProps {
  children: ReactNode
  sectionName: string
  fallback?: ReactNode
}

interface SectionErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Section-specific Error Boundary for isolating errors to specific parts of the UI.
 * Prevents errors in one section from crashing the entire application.
 * 
 * @param children - React children to render
 * @param sectionName - Name of the section for logging purposes
 * @param fallback - Optional custom fallback UI
 */
export class SectionErrorBoundary extends Component<SectionErrorBoundaryProps, SectionErrorBoundaryState> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): Partial<SectionErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(`Error in section: ${this.props.sectionName}`, error, {
      feature: 'section-error-boundary',
      action: 'catch_error',
      section: this.props.sectionName,
      componentStack: errorInfo.componentStack,
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="bg-slate-800 border border-red-500/50 rounded-lg p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-2">Error en {this.props.sectionName}</h3>
          <p className="text-gray-400 text-sm mb-4">
            Ha ocurrido un error en esta sección. El resto de la aplicación sigue funcionando.
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
