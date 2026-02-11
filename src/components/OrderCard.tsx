import { memo } from 'react'
import { formatDateCompact } from '../utils/dateFormatter'
import {
  formatPoForDisplay,
  parsePartNameForDisplay,
  summarizePartNameForDisplay,
} from '../utils/formatUtils'
import type { WorkOrder, Status, Priority } from '../types'
import type { TextSize } from '../types/settings'
import type { ElasticScale } from '../utils/elasticScale'

const STATUS_FOOTER_BG: Record<Status, string> = {
  scheduled: 'bg-blue-500/30',
  production: 'bg-orange-500/30',
  quality: 'bg-green-500/30',
  hold: 'bg-red-500/30',
}

const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'border-slate-600/40',
  normal: 'border-slate-500/50',
  high: 'border-orange-400',
  critical: 'border-red-400',
}

const PRIORITY_GLOW: Record<Priority, string> = {
  low: 'hover:shadow-slate-500/20',
  normal: 'hover:shadow-blue-500/30',
  high: 'hover:shadow-orange-500/40',
  critical: 'hover:shadow-red-500/50',
}

const PRIORITY_BADGE_LABEL: Record<Priority, string> = {
  low: 'PROGRAMADA',
  normal: 'PROGRAMADA',
  high: 'PRIORIDAD',
  critical: 'ON HOLD',
}

const PRIORITY_BADGE_TEXT: Record<Priority, string> = {
  low: 'text-cyan-400',
  normal: 'text-cyan-400',
  high: 'text-orange-400',
  critical: 'text-red-500',
}

/* ========= TV Mode specific maps ========= */

const TV_PRIORITY_BG: Record<Priority, string> = {
  low: 'card-bg-low',
  normal: 'card-bg-normal',
  high: 'card-bg-high',
  critical: 'card-bg-critical',
}

const TV_PRIORITY_GLOW_CLASS: Record<Priority, string> = {
  low: '',
  normal: '',
  high: 'priority-glow-high',
  critical: 'priority-glow-critical',
}

const TV_PRIORITY_BADGE: Record<Priority, { label: string; dotClass: string; textClass: string; bgClass: string }> = {
  low: { label: 'BAJA', dotClass: 'bg-slate-400', textClass: 'text-slate-300', bgClass: 'bg-slate-500/15' },
  normal: { label: 'NORMAL', dotClass: 'bg-blue-400', textClass: 'text-blue-300', bgClass: 'bg-blue-500/15' },
  high: { label: 'ALTA', dotClass: 'bg-orange-400', textClass: 'text-orange-300', bgClass: 'bg-orange-500/15' },
  critical: { label: 'CRÍTICA', dotClass: 'bg-red-400', textClass: 'text-red-300', bgClass: 'bg-red-500/20' },
}

const TV_STATUS_BADGE: Record<Status, { label: string; dotClass: string; textClass: string; pulse: boolean }> = {
  scheduled: { label: 'PROGRAMADA', dotClass: 'bg-blue-400', textClass: 'text-blue-300', pulse: false },
  production: { label: 'EN PRODUCCIÓN', dotClass: 'bg-amber-400', textClass: 'text-amber-300', pulse: true },
  quality: { label: 'CALIDAD', dotClass: 'bg-emerald-400', textClass: 'text-emerald-300', pulse: false },
  hold: { label: 'ON HOLD', dotClass: 'bg-red-400', textClass: 'text-red-300', pulse: true },
}

const getProgressColor = (progress: number): string => {
  if (progress < 50) return 'bg-gradient-to-r from-red-500 to-orange-500'
  if (progress < 80) return 'bg-gradient-to-r from-yellow-500 to-orange-500'
  return 'bg-gradient-to-r from-green-500 to-emerald-500'
}

interface OrderCardProps {
  order: WorkOrder
  scaleFactor?: ElasticScale | null
  tvMode?: boolean
  textSize?: TextSize
}

const getTextSizeMultiplier = (textSize: TextSize = 'normal'): number => {
  switch (textSize) {
    case 'large':
      return 1.2
    case 'extra-large':
      return 1.4
    default:
      return 1.0
  }
}

const getSizeClass = (baseSize: string, textSize: TextSize = 'normal'): string => {
  const multiplier = getTextSizeMultiplier(textSize)
  const sizeMap: Record<string, string[]> = {
    'text-lg': ['text-lg', 'text-xl', 'text-2xl'],
    'text-xl': ['text-xl', 'text-2xl', 'text-3xl'],
    'text-2xl': ['text-2xl', 'text-3xl', 'text-4xl'],
    'text-xs': ['text-xs', 'text-sm', 'text-base'],
    'text-sm': ['text-sm', 'text-base', 'text-lg'],
  }
  const sizes = sizeMap[baseSize] ?? [baseSize, baseSize, baseSize]
  const a = sizes[0]
  const b = sizes[1]
  const c = sizes[2]
  if (multiplier >= 1.3 && c) return c
  if (multiplier >= 1.1 && b) return b
  return a ?? baseSize
}

function renderPartName(partName: string | null | undefined): React.ReactNode {
  const lines = parsePartNameForDisplay(partName || '')
  if (lines.length === 0) return 'N/A'
  return lines.map((line, i) => (
    <div key={i}>
      {line.map((tok, j) =>
        tok.type === 'text' ? (
          tok.value
        ) : (
          <span key={j} className="text-amber-400 font-bold">
            {tok.value} PZS
          </span>
        )
      )}
    </div>
  ))
}

function OrderCardComponent({ order, scaleFactor, tvMode = false, textSize = 'normal' }: OrderCardProps) {
  const {
    po_number,
    part_name,
    company_name: _company_name,
    quantity_total,
    quantity_completed,
    status,
    priority,
    created_at,
  } = order

  const statusFooterBg = STATUS_FOOTER_BG[status] || STATUS_FOOTER_BG.scheduled
  const priorityBorderClass = PRIORITY_COLORS[priority] || PRIORITY_COLORS.normal
  const priorityGlowClass = PRIORITY_GLOW[priority] || PRIORITY_GLOW.normal
  const badgeLabel = PRIORITY_BADGE_LABEL[priority] ?? 'PROGRAMADA'
  const badgeTextClass = PRIORITY_BADGE_TEXT[priority] ?? 'text-cyan-400'

  // Calculate progress
  const progress = quantity_total > 0
    ? Math.round((quantity_completed / quantity_total) * 100)
    : 0
  const progressColorClass = getProgressColor(progress)

  // TV Mode: larger PO base for 3–4m viewing; vertical post-it layout
  const basePoNumberSize = tvMode ? 'text-2xl' : (scaleFactor?.poNumberSize || 'text-2xl')
  const baseQuantitySize = tvMode ? 'text-2xl' : (scaleFactor?.quantitySize || 'text-xl')
  const basePartNameSize = tvMode ? 'text-sm' : (scaleFactor?.partNameSize || 'text-sm')
  const baseMetaSize = tvMode ? 'text-lg' : (scaleFactor?.metaSize || 'text-[10px]')
  const baseStatusSize = tvMode ? 'text-xl' : (scaleFactor?.metaSize || 'text-[11px]')

  const poNumberSize = tvMode ? getSizeClass('text-2xl', textSize) : basePoNumberSize
  const quantitySize = tvMode ? getSizeClass('text-2xl', textSize) : baseQuantitySize
  const partNameSize = tvMode ? getSizeClass('text-sm', textSize) : basePartNameSize
  const metaSize = tvMode ? getSizeClass('text-lg', textSize) : baseMetaSize
  const statusSize = tvMode ? getSizeClass('text-xl', textSize) : baseStatusSize
  const paddingX = tvMode ? 'px-2' : (scaleFactor?.paddingX || 'px-2')
  const paddingY = tvMode ? 'py-[0.5vh]' : (scaleFactor?.paddingY || 'py-1')
  const scaleValue = scaleFactor?.scaleFactor || 1
  const innerGap = tvMode ? 'gap-y-1.5' : 'gap-0'
  const priorityBorderWidth = tvMode ? 'border-2' : (priority === 'critical' || priority === 'high' ? 'border-[3px]' : 'border-2')
  const progressBarHeight = tvMode ? 'h-0.5' : 'h-1'

  if (tvMode) {
    const bodyPartSize = getSizeClass('text-xl', textSize)
    const priorityBadge = TV_PRIORITY_BADGE[priority] ?? TV_PRIORITY_BADGE.normal
    const statusBadge = TV_STATUS_BADGE[status] ?? TV_STATUS_BADGE.scheduled
    const bgClass = TV_PRIORITY_BG[priority] ?? 'card-bg-normal'
    const glowClass = TV_PRIORITY_GLOW_CLASS[priority] ?? ''
    const borderWidth = (priority === 'critical') ? 'border-[3px]' : (priority === 'high') ? 'border-2' : 'border'

    return (
      <div
        className={`
          relative min-h-0 h-full overflow-hidden
          ${bgClass}
          rounded-xl ${borderWidth} ${priorityBorderClass}
          px-3 py-2.5
          flex flex-col justify-between
          transition-all duration-300 ease-out
          ${glowClass}
        `}
        role="article"
        aria-label={po_number ? `Orden ${po_number} - ${part_name} - ${statusBadge.label}` : `Orden - ${part_name}`}
      >
        {/* Top section: SO + Priority + Date */}
        <div className="flex items-center justify-between gap-2 flex-shrink-0 mb-auto">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base font-extrabold text-fuchsia-400 flex-shrink-0 leading-none" title={po_number || ''}>
              SO/{formatPoForDisplay(po_number).replace(/^\(|\)$/g, '')}
            </span>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${priorityBadge.textClass} ${priorityBadge.bgClass}`}>
              <span className={`${(priority === 'critical' || priority === 'high') ? 'status-dot-pulse' : 'status-dot-static'} ${priorityBadge.dotClass}`} style={{ width: 5, height: 5 }} />
              {priorityBadge.label}
            </span>
          </div>
          <span className="text-xs text-slate-500 flex-shrink-0 font-medium">
            {formatDateCompact(created_at)}
          </span>
        </div>

        {/* Middle: Part name (hero text - grows to fill available space) */}
        <div className="flex-1 min-h-0 overflow-hidden flex items-center py-1" title={part_name || ''}>
          <div
            className={`${bodyPartSize} font-black text-white uppercase break-words leading-snug line-clamp-4 w-full`}
          >
            {part_name
              ? part_name.replace(/\{(\d+)\}/g, ' $1 PZS').trim() || 'N/A'
              : 'N/A'}
          </div>
        </div>

        {/* Bottom section: Progress + PZS + Status */}
        <div className="flex-shrink-0 mt-auto space-y-1.5">
          {/* Progress bar (prominent) */}
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="h-3 bg-slate-700/60 rounded-full overflow-hidden shimmer-bar">
                <div
                  className={`h-full ${progressColorClass} rounded-full transition-all duration-500 ease-out`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
            <span className="text-lg font-black text-white flex-shrink-0 tabular-nums min-w-[3ch] text-right">
              {progress}%
            </span>
          </div>

          {/* PZS + Status row */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-lg font-black text-yellow-400 flex-shrink-0">
              {quantity_total ?? 0} <span className="text-yellow-400/50 font-semibold text-sm">PZS</span>
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-bold uppercase tracking-wide ${statusBadge.textClass} ${statusFooterBg}`}>
              <span className={`${statusBadge.pulse ? 'status-dot-pulse' : 'status-dot-static'} ${statusBadge.dotClass}`} style={{ width: 7, height: 7 }} />
              {statusBadge.label}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`
        relative
        bg-[#111827]
        rounded-lg ${priorityBorderWidth} ${priorityBorderClass}
        ${paddingX} ${paddingY}
        flex flex-col ${innerGap}
        transition-all duration-300 ease-out
        hover:border-opacity-100 hover:shadow-lg ${priorityGlowClass}
        hover:scale-[1.02]
        animate-fade-in
        h-full
        overflow-hidden
        shadow-multi
      `}
      style={{ '--card-scale': scaleValue } as React.CSSProperties}
      role="article"
      aria-label={po_number ? `Orden ${po_number} - ${part_name}` : `Orden - ${part_name}`}
    >
      {(priority === 'high' || priority === 'critical') && (
        <div className={`absolute top-0 left-0 right-0 h-1 ${priorityBorderClass.replace('border-', 'bg-')} opacity-90`} />
      )}

      <div className={`flex items-center justify-between mb-0.5`}>
        <div className="flex-1 min-w-0" title={po_number || ''}>
          <div className={`${poNumberSize} font-black text-white text-shadow leading-none`}>
            {formatPoForDisplay(po_number)}
          </div>
        </div>
        <div className={`${quantitySize} font-black text-yellow-300 ml-2 flex-shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>
          {quantity_total ?? 0} <span className="text-slate-400 font-normal text-xs">PZS</span>
        </div>
      </div>

      <div className={`min-h-0 flex-1 mb-0.5 overflow-hidden`} title={part_name || ''}>
        <div className={`${partNameSize} font-semibold text-white uppercase break-words leading-tight flex flex-col gap-y-0.5`}>
          {renderPartName(summarizePartNameForDisplay(part_name || '', 80))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-1.5 mt-auto">
        {quantity_total > 0 && (
          <div className="flex-1 min-w-0 flex items-center gap-1.5">
            <div className="flex-1 min-w-0">
              <div className={`${progressBarHeight} bg-slate-700 rounded-full overflow-hidden`}>
                <div
                  className={`h-full ${progressColorClass} rounded-full transition-all duration-500 ease-out progress-bar`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
            <div className={`${metaSize} font-black text-white flex-shrink-0`}>
              {progress}%
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className={`${metaSize} font-bold text-gray-400`}>
            {formatDateCompact(created_at)}
          </div>
          <div
            className={`
              rounded border-2 px-1 py-0.5
              ${statusSize} font-black uppercase tracking-wide
              border-current ${badgeTextClass}
            `}
          >
            {badgeLabel}
          </div>
        </div>
      </div>
    </div>
  )
}

// Custom comparison function for memoization
function areEqual(prevProps: OrderCardProps, nextProps: OrderCardProps): boolean {
  // Compare order ID
  if (prevProps.order.id !== nextProps.order.id) return false

  // Compare scale factor, tvMode, and textSize
  if (prevProps.scaleFactor?.scaleFactor !== nextProps.scaleFactor?.scaleFactor) return false
  if (prevProps.tvMode !== nextProps.tvMode) return false
  if (prevProps.textSize !== nextProps.textSize) return false

  // Compare order data that affects display
  if (
    prevProps.order.po_number !== nextProps.order.po_number ||
    prevProps.order.part_name !== nextProps.order.part_name ||
    prevProps.order.company_name !== nextProps.order.company_name ||
    prevProps.order.quantity_total !== nextProps.order.quantity_total ||
    prevProps.order.quantity_completed !== nextProps.order.quantity_completed ||
    prevProps.order.status !== nextProps.order.status ||
    prevProps.order.priority !== nextProps.order.priority ||
    prevProps.order.created_at !== nextProps.order.created_at
  ) {
    return false
  }

  return true
}

export const OrderCard = memo(OrderCardComponent, areEqual)
