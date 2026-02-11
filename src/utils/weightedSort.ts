import type { WorkOrder } from '../types'

const SCORE_ON_HOLD = 1000
const SCORE_PRIORIDAD = 500
const SCORE_URGENTE = 100
const SCORE_OVERDUE = 50
/** Extra weight when prioritizeOldOrders is enabled */
const SCORE_OVERDUE_BOOSTED = 800

export interface WeightedSortOptions {
  /** When true, older orders (created before today) get a much higher score so they appear first */
  prioritizeOldOrders?: boolean
  /** When true, within the same priority tier, shorter part_name cards come first for visual compactness */
  groupBySize?: boolean
}

function getOrderScore(
  order: WorkOrder,
  startOfTodayMs: number,
  options: WeightedSortOptions = {},
  createdMs?: number,
): number {
  let score = 0

  if (order.status === 'hold' || order.priority === 'critical') {
    score += SCORE_ON_HOLD
  } else if (order.priority === 'high') {
    score += SCORE_PRIORIDAD
  }

  const partName = (order.part_name || '').toUpperCase()
  if (partName.includes('URGENTE')) {
    score += SCORE_URGENTE
  }

  const effectiveCreatedMs =
    typeof createdMs === 'number' ? createdMs : new Date(order.created_at).getTime()

  if (effectiveCreatedMs < startOfTodayMs) {
    score += options.prioritizeOldOrders ? SCORE_OVERDUE_BOOSTED : SCORE_OVERDUE
  }

  return score
}

/**
 * Smart sort: ON HOLD / PRIORIDAD first, then overdue (created before today), then FIFO by created_at.
 * Optional boost for "URGENTE" in part_name.
 *
 * Options:
 * - `prioritizeOldOrders`: boosts overdue score so older orders always float to top
 * - `groupBySize`: within the same score tier, shorter part_name cards come first (Tetris mode)
 */
export function weightedSort(
  orders: WorkOrder[],
  options: WeightedSortOptions = {},
): WorkOrder[] {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const startOfTodayMs = startOfToday.getTime()

  const createdAtMsById = new Map<string, number>()
  for (const order of orders) {
    const createdMs = new Date(order.created_at).getTime()
    createdAtMsById.set(order.id, createdMs)
  }

  return [...orders].sort((a, b) => {
    const createdMsA = createdAtMsById.get(a.id) ?? new Date(a.created_at).getTime()
    const createdMsB = createdAtMsById.get(b.id) ?? new Date(b.created_at).getTime()

    const scoreA = getOrderScore(a, startOfTodayMs, options, createdMsA)
    const scoreB = getOrderScore(b, startOfTodayMs, options, createdMsB)
    if (scoreB !== scoreA) return scoreB - scoreA

    // Tetris mode: within the same priority tier, shorter part_name first
    if (options.groupBySize) {
      const lenA = (a.part_name || '').length
      const lenB = (b.part_name || '').length
      if (lenA !== lenB) return lenA - lenB
    }

    return createdMsA - createdMsB
  })
}
