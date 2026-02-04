import { useState, useCallback } from 'react'

export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const

export type ToastType = typeof TOAST_TYPES[keyof typeof TOAST_TYPES]

export interface Toast {
  id: number
  message: string
  type: ToastType
  duration: number
}

const TOAST_DURATION = 3000

/**
 * Hook for managing toast notifications
 * @returns Toast management functions and state
 */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((
    message: string,
    type: ToastType = TOAST_TYPES.INFO,
    duration = TOAST_DURATION
  ): number => {
    const id = Date.now() + Math.random()
    const newToast: Toast = { id, message, type, duration }

    setToasts((prevToasts) => [...prevToasts, newToast])

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id: number): void => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }, [])

  const success = useCallback(
    (message: string, duration?: number) => showToast(message, TOAST_TYPES.SUCCESS, duration),
    [showToast]
  )

  const error = useCallback(
    (message: string, duration?: number) => showToast(message, TOAST_TYPES.ERROR, duration),
    [showToast]
  )

  const warning = useCallback(
    (message: string, duration?: number) => showToast(message, TOAST_TYPES.WARNING, duration),
    [showToast]
  )

  const info = useCallback(
    (message: string, duration?: number) => showToast(message, TOAST_TYPES.INFO, duration),
    [showToast]
  )

  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clearAll,
  }
}
