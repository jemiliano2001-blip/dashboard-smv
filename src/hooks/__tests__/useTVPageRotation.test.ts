import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTVPageRotation } from '../useTVPageRotation'

describe('useTVPageRotation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('rota páginas dentro de la misma compañía', () => {
    const items = {
      A: [1, 2, 3, 4],
    }

    const { result } = renderHook(() =>
      useTVPageRotation({
        items,
        companies: ['A'],
        rotationInterval: 1000,
        pageRotationInterval: 1000,
        itemsPerPage: 2,
      }),
    )

    expect(result.current.currentCompany).toBe('A')
    expect(result.current.currentItems).toEqual([1, 2])
    expect(result.current.currentPage).toBe(1)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.currentItems).toEqual([3, 4])
    expect(result.current.currentPage).toBe(2)
  })

  it('rota a la siguiente compañía cuando se acaban las páginas', () => {
    const items = {
      A: [1, 2],
      B: [3, 4],
    }

    const { result } = renderHook(() =>
      useTVPageRotation({
        items,
        companies: ['A', 'B'],
        rotationInterval: 5000,
        pageRotationInterval: 1000,
        itemsPerPage: 2,
      }),
    )

    expect(result.current.currentCompany).toBe('A')

    // Company A has only 1 page, so after the interval it should go to B
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.currentCompany).toBe('B')
    expect(result.current.currentItems).toEqual([3, 4])
  })

  it('cicla de vuelta a la primera compañía', () => {
    const items = {
      A: [1],
      B: [2],
    }

    const { result } = renderHook(() =>
      useTVPageRotation({
        items,
        companies: ['A', 'B'],
        rotationInterval: 1000,
        pageRotationInterval: 1000,
        itemsPerPage: 5,
      }),
    )

    expect(result.current.currentCompany).toBe('A')

    act(() => {
      vi.advanceTimersByTime(1000) // A -> B
    })
    expect(result.current.currentCompany).toBe('B')

    act(() => {
      vi.advanceTimersByTime(1000) // B -> A
    })
    expect(result.current.currentCompany).toBe('A')
  })

  it('maneja compañías vacías sin errores', () => {
    const { result } = renderHook(() =>
      useTVPageRotation({
        items: {},
        companies: [],
        rotationInterval: 1000,
        pageRotationInterval: 1000,
        itemsPerPage: 5,
      }),
    )

    expect(result.current.currentCompany).toBeNull()
    expect(result.current.currentItems).toEqual([])
    expect(result.current.totalPages).toBe(1)

    // Should not crash when timer fires
    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(result.current.currentCompany).toBeNull()
  })

  it('maneja compañía sin items', () => {
    const items = {
      A: [] as number[],
    }

    const { result } = renderHook(() =>
      useTVPageRotation({
        items,
        companies: ['A'],
        rotationInterval: 1000,
        pageRotationInterval: 1000,
        itemsPerPage: 5,
      }),
    )

    expect(result.current.currentCompany).toBe('A')
    expect(result.current.currentItems).toEqual([])
    expect(result.current.totalPages).toBe(1)
  })

  it('reporta totalPages correcto', () => {
    const items = {
      A: [1, 2, 3, 4, 5],
    }

    const { result } = renderHook(() =>
      useTVPageRotation({
        items,
        companies: ['A'],
        rotationInterval: 5000,
        pageRotationInterval: 1000,
        itemsPerPage: 2,
      }),
    )

    expect(result.current.totalPages).toBe(3) // ceil(5/2) = 3
  })

  it('usa rotationInterval como fallback cuando pageRotationInterval no se provee', () => {
    const items = {
      A: [1, 2, 3, 4],
    }

    const { result } = renderHook(() =>
      useTVPageRotation({
        items,
        companies: ['A'],
        rotationInterval: 2000,
        itemsPerPage: 2,
      }),
    )

    expect(result.current.currentPage).toBe(1)

    // Should not advance at 1000ms since interval is 2000ms
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.currentPage).toBe(1)

    // Should advance at 2000ms
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.currentPage).toBe(2)
  })

  it('resetea pageIndex al cambiar de compañía', () => {
    const items = {
      A: [1, 2, 3, 4],
      B: [5, 6, 7, 8],
    }

    const { result } = renderHook(() =>
      useTVPageRotation({
        items,
        companies: ['A', 'B'],
        rotationInterval: 5000,
        pageRotationInterval: 1000,
        itemsPerPage: 2,
      }),
    )

    // Advance through A's pages
    act(() => {
      vi.advanceTimersByTime(1000) // page 2 of A
    })
    expect(result.current.currentPage).toBe(2)

    act(() => {
      vi.advanceTimersByTime(1000) // page 2 was last for A -> goes to B page 1
    })
    expect(result.current.currentCompany).toBe('B')
    expect(result.current.currentPage).toBe(1)
  })

  it('limpia timers cuando se desmonta', () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')

    const { unmount } = renderHook(() =>
      useTVPageRotation({
        items: { A: [1] },
        companies: ['A'],
        rotationInterval: 1000,
        pageRotationInterval: 1000,
        itemsPerPage: 5,
      }),
    )

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })
})
