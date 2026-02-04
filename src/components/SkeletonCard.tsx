import { memo } from 'react'

/**
 * Skeleton loader for OrderCard (TV layout: Header SO+fecha, Body part name, Footer PZS+estatus)
 */
function SkeletonCardComponent() {
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg px-2 py-[0.5vh] animate-pulse h-full flex flex-col min-h-0 overflow-hidden">
      {/* A. Header: SO (left), Fecha (right) */}
      <div className="flex justify-between items-start gap-2 flex-shrink-0 mb-1">
        <div className="h-5 bg-slate-700 rounded w-20 flex-shrink-0" />
        <div className="h-4 bg-slate-700 rounded w-14 flex-shrink-0" />
      </div>

      {/* B. Body: Part name (dominant) */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-1">
        <div className="h-6 bg-slate-700 rounded w-full" />
        <div className="h-6 bg-slate-700 rounded w-4/5" />
      </div>

      {/* C. Footer: PZS (left), Estatus (right) */}
      <div className="flex-shrink-0 flex flex-row items-center justify-between gap-2 mt-auto py-1.5 px-2 bg-slate-700/50 rounded-b-lg -mx-2 -mb-2">
        <div className="h-6 bg-slate-600 rounded w-16 flex-shrink-0" />
        <div className="h-5 bg-slate-600 rounded w-20 flex-shrink-0" />
      </div>
    </div>
  )
}

export const SkeletonCard = memo(SkeletonCardComponent)
