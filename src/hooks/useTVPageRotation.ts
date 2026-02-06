import { useState, useEffect, useMemo, useRef } from 'react'

export interface UseTVPageRotationProps<T> {
  /** Objeto { "Company A": [items...], "Company B": [items...] } */
  items: Record<string, T[]>
  /** Lista de llaves ["Company A", "Company B"] */
  companies: string[]
  /** Tiempo en ms por página */
  rotationInterval: number
  itemsPerPage: number
}

export interface UseTVPageRotationReturn<T> {
  currentCompany: string | null
  currentItems: T[]
  currentPage: number
  totalPages: number
  /** Ms restantes hasta el siguiente cambio (página o compañía); 0 si no aplica */
  nextCompanyIn: number
}

export function useTVPageRotation<T>({
  items,
  companies,
  rotationInterval,
  itemsPerPage,
}: UseTVPageRotationProps<T>): UseTVPageRotationReturn<T> {
  const [companyIndex, setCompanyIndex] = useState(0)
  const [pageIndex, setPageIndex] = useState(0)
  const lastTickRef = useRef<number>(Date.now())
  const pageIndexRef = useRef(pageIndex)
  const totalPagesRef = useRef(0)

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

  useEffect(() => {
    if (companies.length === 0) return

    const interval = setInterval(() => {
      lastTickRef.current = Date.now()
      const prevPage = pageIndexRef.current
      const total = totalPagesRef.current
      const nextPage = prevPage + 1

      if (nextPage < total) {
        setPageIndex(nextPage)
      } else {
        setCompanyIndex((prev) => (prev + 1) % companies.length)
        setPageIndex(0)
      }
    }, rotationInterval)

    return () => clearInterval(interval)
  }, [companies.length, rotationInterval])

  const currentItems = useMemo(() => {
    const start = pageIndex * itemsPerPage
    return companyItems.slice(start, start + itemsPerPage)
  }, [companyItems, pageIndex, itemsPerPage])

  const nextCompanyIn = useMemo(() => {
    if (rotationInterval <= 0) return 0
    const elapsed = Date.now() - lastTickRef.current
    return Math.max(0, Math.min(rotationInterval, rotationInterval - (elapsed % rotationInterval)))
  }, [rotationInterval, pageIndex, currentCompany])

  return {
    currentCompany,
    currentItems,
    currentPage: pageIndex + 1,
    totalPages,
    nextCompanyIn,
  }
}
