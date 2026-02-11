/**
 * Centralized logging utility for structured error handling.
 *
 * In development: logs to console.
 * In production: queues errors and sends them to a configurable endpoint
 * (e.g. Sentry, LogRocket, or a custom error-tracking API).
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

/** Maximum number of errors to buffer before flushing */
const ERROR_BUFFER_MAX = 10
/** Flush interval in ms (30 seconds) */
const FLUSH_INTERVAL_MS = 30_000

class Logger {
  private readonly isDev: boolean
  private errorBuffer: ErrorLogData[] = []
  private flushTimer: ReturnType<typeof setInterval> | null = null
  private readonly errorEndpoint: string | null

  constructor() {
    this.isDev = import.meta.env.DEV
    this.errorEndpoint = import.meta.env.VITE_ERROR_TRACKING_URL || null

    // Set up periodic flush for production error reporting
    if (!this.isDev && this.errorEndpoint) {
      this.flushTimer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS)
    }
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

    if (this.isDev) {
      console.error('[ERROR]', logData)
    }

    // Queue for production error reporting
    this.bufferError(logData)
  }

  /**
   * Log a warning
   * @param message - Warning message
   * @param context - Additional context
   */
  warn(message: string, context: LogContext = {}): void {
    if (this.isDev) {
      console.warn('[WARN]', { message, ...context })
    }
  }

  /**
   * Log informational message
   * @param message - Info message
   * @param context - Additional context
   */
  info(message: string, context: LogContext = {}): void {
    if (this.isDev) {
      console.info('[INFO]', { message, ...context })
    }
  }

  /**
   * Log debug message
   * @param message - Debug message
   * @param context - Additional context
   */
  debug(message: string, context: LogContext = {}): void {
    if (this.isDev) {
      console.debug('[DEBUG]', { message, ...context })
    }
  }

  /**
   * Buffer an error for batch reporting in production.
   * Flushes immediately if buffer reaches max size.
   */
  private bufferError(logData: ErrorLogData): void {
    if (!this.errorEndpoint) return

    this.errorBuffer.push(logData)

    if (this.errorBuffer.length >= ERROR_BUFFER_MAX) {
      this.flush()
    }
  }

  /**
   * Send buffered errors to the error tracking endpoint.
   * Uses navigator.sendBeacon for reliability (survives page unload).
   * Falls back to fetch if sendBeacon is unavailable.
   */
  flush(): void {
    if (!this.errorEndpoint || this.errorBuffer.length === 0) return

    const errors = [...this.errorBuffer]
    this.errorBuffer = []

    const payload = JSON.stringify({
      errors,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sentAt: new Date().toISOString(),
    })

    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          this.errorEndpoint,
          new Blob([payload], { type: 'application/json' })
        )
      } else {
        fetch(this.errorEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {
          // Silently fail - we don't want error reporting to cause more errors
        })
      }
    } catch {
      // Silently fail
    }
  }

  /**
   * Clean up the logger (flush remaining errors, clear timers).
   * Call this when the app is shutting down.
   */
  destroy(): void {
    this.flush()
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
  }
}

export const logger = new Logger()

// Flush remaining errors before page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    logger.flush()
  })
}
