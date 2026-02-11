import { useState, useEffect, useMemo, useRef, useCallback } from 'react'

export interface UseTVPageRotationProps<T> {
  /** Objeto { "Company A": [items...], "Company B": [items...] } */
  items: Record<string, T[]>
  /** Lista de llaves ["Company A", "Company B"] */
  companies: string[]
  /** Tiempo en ms para la rotación entre compañías (cuando se pasa a la siguiente compañía) */
  rotationInterval: number
  /** Tiempo en ms para la rotación entre páginas dentro de la misma compañía.
   *  Si no se proporciona, se usa rotationInterval. */
  pageRotationInterval?: number
  itemsPerPage: number
}

export interface UseTVPageRotationReturn<T> {
  currentCompany: string | null
  currentItems: T[]
  currentPage: number
  totalPages: number
  /** Ms restantes hasta el siguiente cambio (página o compañía); 0 si no aplica */
  nextCompanyIn: number
  /** 0-100 progress of the current rotation countdown (100 = just started, 0 = about to change) */
  progress: number
  /** Current company index (0-based) */
  companyIndex: number
  /** Total number of companies */
  totalCompanies: number
  /** true if currently showing the last page of the current company */
  isLastPage: boolean
}

export function useTVPageRotation<T>({
  items,
  companies,
  rotationInterval,
  pageRotationInterval,
  itemsPerPage,
}: UseTVPageRotationProps<T>): UseTVPageRotationReturn<T> {
  const [companyIndex, setCompanyIndex] = useState(0)
  const [pageIndex, setPageIndex] = useState(0)
  const lastTickRef = useRef<number>(Date.now())
  const pageIndexRef = useRef(pageIndex)
  const totalPagesRef = useRef(0)

  // Use pageRotationInterval for page-level rotation; fall back to rotationInterval
  const effectivePageInterval = pageRotationInterval ?? rotationInterval

  const safeCompanyIndex = companies.length > 0 ? companyIndex % companies.length : 0
  const currentCompany = companies[safeCompanyIndex] ?? null

  const companyItems = useMemo(
    () => (currentCompany ? items[currentCompany] ?? [] : []),
    [currentCompany, items]
  )

  const totalPages = Math.max(1, Math.ceil(companyItems.length / itemsPerPage))
  pageIndexRef.current = pageIndex
  totalPagesRef.current = totalPages

  useEffect(() => {
    if (pageIndex >= totalPages) {
      setPageIndex(0)
    }
  }, [pageIndex, totalPages])

  const advanceToNextCompany = useCallback(() => {
    if (companies.length === 0) return
    setCompanyIndex((prev) => (prev + 1) % companies.length)
    setPageIndex(0)
  }, [companies.length])

  useEffect(() => {
    if (companies.length === 0) return () => {}

    const interval = setInterval(() => {
      lastTickRef.current = Date.now()
      const prevPage = pageIndexRef.current
      const total = totalPagesRef.current
      const nextPage = prevPage + 1

      if (nextPage < total) {
        // Still more pages for this company — advance page
        setPageIndex(nextPage)
      } else {
        // Last page reached — move to next company
        advanceToNextCompany()
      }
    }, effectivePageInterval)

    return () => clearInterval(interval)
  }, [companies.length, effectivePageInterval, advanceToNextCompany])

  const currentItems = (() => {
    const start = pageIndex * itemsPerPage
    return companyItems.slice(start, start + itemsPerPage)
  })()

  const [nextCompanyIn, setNextCompanyIn] = useState(effectivePageInterval)
  const [progress, setProgress] = useState(100)

  // Update nextCompanyIn and progress reactively every 100ms for smooth animation
  useEffect(() => {
    if (effectivePageInterval <= 0 || companies.length === 0) {
      setNextCompanyIn(0)
      setProgress(100)
      return undefined
    }

    const updateCountdown = () => {
      const elapsed = Date.now() - lastTickRef.current
      const remaining = Math.max(0, effectivePageInterval - elapsed)
      setNextCompanyIn(remaining)
      setProgress(effectivePageInterval > 0 ? (remaining / effectivePageInterval) * 100 : 100)
    }

    updateCountdown()
    const countdownInterval = setInterval(updateCountdown, 100)
    return () => clearInterval(countdownInterval)
  }, [effectivePageInterval, companies.length])

  const isLastPage = pageIndex + 1 >= totalPages

  return {
    currentCompany,
    currentItems,
    currentPage: pageIndex + 1,
    totalPages,
    nextCompanyIn,
    progress,
    companyIndex: safeCompanyIndex,
    totalCompanies: companies.length,
    isLastPage,
  }
}
