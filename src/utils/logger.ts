/**
 * Centralized logging utility for structured error handling
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug'

interface LogContext {
  feature?: string
  action?: string
  [key: string]: unknown
}

interface ErrorLogData extends LogContext {
  level: LogLevel
  message: string
  timestamp: string
  error?: {
    name: string
    message: string
    stack?: string
  }
}

class Logger {
  private enabled: boolean

  constructor() {
    this.enabled = import.meta.env.DEV
  }

  /**
   * Log an error with context
   * @param message - Error message
   * @param error - Error object
   * @param context - Additional context information
   */
  error(message: string, error: Error | null = null, context: LogContext = {}): void {
    const logData: ErrorLogData = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      ...context,
    }

    if (error) {
      logData.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    }

    if (this.enabled) {
      console.error('[ERROR]', logData)
    }

    // In production, you could send this to an error tracking service
    // e.g., Sentry, LogRocket, etc.
  }

  /**
   * Log a warning
   * @param message - Warning message
   * @param context - Additional context
   */
  warn(message: string, context: LogContext = {}): void {
    if (this.enabled) {
      console.warn('[WARN]', { message, ...context })
    }
  }

  /**
   * Log informational message
   * @param message - Info message
   * @param context - Additional context
   */
  info(message: string, context: LogContext = {}): void {
    if (this.enabled) {
      console.info('[INFO]', { message, ...context })
    }
  }

  /**
   * Log debug message
   * @param message - Debug message
   * @param context - Additional context
   */
  debug(message: string, context: LogContext = {}): void {
    if (this.enabled) {
      console.debug('[DEBUG]', { message, ...context })
    }
  }
}

export const logger = new Logger()
