import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToast, TOAST_TYPES } from '../useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with empty toasts', () => {
    const { result } = renderHook(() => useToast())
    expect(result.current.toasts).toEqual([])
  })

  it('should add toast when showToast is called', () => {
    const { result } = renderHook(() => useToast())
    
    act(() => {
      result.current.showToast('Test message', TOAST_TYPES.SUCCESS)
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0]?.message).toBe('Test message')
    expect(result.current.toasts[0]?.type).toBe(TOAST_TYPES.SUCCESS)
  })

  it('should remove toast when removeToast is called', () => {
    const { result } = renderHook(() => useToast())
    
    let toastId: number
    act(() => {
      toastId = result.current.showToast('Test message')
    })

    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      if (toastId) {
        result.current.removeToast(toastId)
      }
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('should provide convenience methods', () => {
    const { result } = renderHook(() => useToast())
    
    act(() => {
      result.current.success('Success message')
      result.current.error('Error message')
      result.current.warning('Warning message')
      result.current.info('Info message')
    })

    expect(result.current.toasts).toHaveLength(4)
    expect(result.current.toasts[0]?.type).toBe(TOAST_TYPES.SUCCESS)
    expect(result.current.toasts[1]?.type).toBe(TOAST_TYPES.ERROR)
    expect(result.current.toasts[2]?.type).toBe(TOAST_TYPES.WARNING)
    expect(result.current.toasts[3]?.type).toBe(TOAST_TYPES.INFO)
  })

  it('should clear all toasts', () => {
    const { result } = renderHook(() => useToast())
    
    act(() => {
      result.current.showToast('Message 1')
      result.current.showToast('Message 2')
    })

    expect(result.current.toasts).toHaveLength(2)

    act(() => {
      result.current.clearAll()
    })

    expect(result.current.toasts).toHaveLength(0)
  })
})
