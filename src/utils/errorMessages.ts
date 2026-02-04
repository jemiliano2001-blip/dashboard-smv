import type { ApiError } from '../types'

export interface ErrorContext {
  code?: string
  action?: string
  details?: unknown
}

/**
 * Gets a user-friendly error message based on error code or message
 */
export function getErrorMessage(error: Error | string | null | undefined, context?: ErrorContext): string {
  if (!error) return 'Ha ocurrido un error desconocido'

  const errorMessage = typeof error === 'string' ? error : error.message
  const errorCode = context?.code || (typeof error === 'object' && 'code' in error ? (error as ApiError).code : undefined)

  // Map common error codes to user-friendly messages
  const errorCodeMap: Record<string, string> = {
    'PGRST116': 'No se encontraron datos',
    '23505': 'Ya existe un registro con estos datos',
    '23503': 'No se puede eliminar porque tiene registros relacionados',
    '42501': 'No tienes permisos para realizar esta acción',
    'network': 'Error de conexión. Verifica tu conexión a internet.',
    'timeout': 'La solicitud tardó demasiado. Por favor, intenta de nuevo.',
  }

  if (errorCode && errorCodeMap[errorCode]) {
    return errorCodeMap[errorCode]
  }

  // Map common error messages
  if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
    return 'Error de conexión. Verifica tu conexión a internet y que el servidor esté disponible.'
  }

  if (errorMessage.includes('timeout')) {
    return 'La solicitud tardó demasiado. Por favor, intenta de nuevo.'
  }

  if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
    return 'No tienes permisos para realizar esta acción. Contacta al administrador.'
  }

  // Return original message if no mapping found
  return errorMessage || 'Ha ocurrido un error desconocido'
}

/**
 * Gets suggestions for common errors
 */
export function getErrorSuggestions(error: Error | string | null | undefined): string[] {
  const errorMessage = typeof error === 'string' ? error : error?.message || ''
  const suggestions: string[] = []

  if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
    suggestions.push('Verifica tu conexión a internet')
    suggestions.push('Comprueba que el servidor esté en funcionamiento')
    suggestions.push('Intenta recargar la página')
  }

  if (errorMessage.includes('timeout')) {
    suggestions.push('Intenta nuevamente en unos momentos')
    suggestions.push('Verifica tu conexión a internet')
  }

  if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
    suggestions.push('Verifica que tengas los permisos necesarios')
    suggestions.push('Contacta al administrador del sistema')
  }

  if (errorMessage.includes('23505')) {
    suggestions.push('Verifica que no exista un registro duplicado')
    suggestions.push('Intenta con datos diferentes')
  }

  return suggestions
}
