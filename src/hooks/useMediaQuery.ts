import { useState, useEffect } from 'react'

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

/**
 * Hook to detect current viewport breakpoint
 */
export function useMediaQuery(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('sm')

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth

      if (width >= 1536) {
        setBreakpoint('2xl')
      } else if (width >= 1280) {
        setBreakpoint('xl')
      } else if (width >= 1024) {
        setBreakpoint('lg')
      } else if (width >= 768) {
        setBreakpoint('md')
      } else {
        setBreakpoint('sm')
      }
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)

    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  return breakpoint
}
