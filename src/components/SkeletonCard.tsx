import { memo } from 'react'

interface SkeletonCardProps {
  index?: number
}

/**
 * Skeleton loader matching the TV OrderCard layout:
 * Top: SO + Priority + Date
 * Middle: Part name (flex-1)
 * Bottom: Progress bar + PZS + Status
 */
function SkeletonCardComponent({ index = 0 }: SkeletonCardProps) {
  return (
    <div
      className="card-bg-normal border border-slate-700/40 rounded-xl px-3 py-2.5 h-full flex flex-col justify-between min-h-0 overflow-hidden animate-fade-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Top: SO + Priority + Date */}
      <div className="flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-4 skeleton-shimmer rounded w-20 flex-shrink-0" />
          <div className="h-4 skeleton-shimmer rounded w-16 flex-shrink-0" />
        </div>
        <div className="h-3 skeleton-shimmer rounded w-14 flex-shrink-0" />
      </div>

      {/* Middle: Part name */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col justify-center gap-2 py-2">
        <div className="h-5 skeleton-shimmer rounded w-full" />
        <div className="h-5 skeleton-shimmer rounded w-4/5" />
        <div className="h-5 skeleton-shimmer rounded w-3/5" />
      </div>

      {/* Bottom: Progress + PZS + Status */}
      <div className="flex-shrink-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-3 skeleton-shimmer rounded-full" />
          <div className="h-5 skeleton-shimmer rounded w-10 flex-shrink-0" />
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="h-5 skeleton-shimmer rounded w-16 flex-shrink-0" />
          <div className="h-6 skeleton-shimmer rounded-lg w-28 flex-shrink-0" />
        </div>
      </div>
    </div>
  )
}

export const SkeletonCard = memo(SkeletonCardComponent)
