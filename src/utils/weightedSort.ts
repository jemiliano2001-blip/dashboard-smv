import type { WorkOrder } from '../types'

const SCORE_ON_HOLD = 1000
const SCORE_PRIORIDAD = 500
const SCORE_URGENTE = 100
const SCORE_OVERDUE = 50

function getOrderScore(order: WorkOrder, startOfTodayMs: number): number {
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

  const createdMs = new Date(order.created_at).getTime()
  if (createdMs < startOfTodayMs) {
    score += SCORE_OVERDUE
  }

  return score
}

/**
 * Smart sort: ON HOLD / PRIORIDAD first, then overdue (created before today), then FIFO by created_at.
 * Optional boost for "URGENTE" in part_name.
 */
export function weightedSort(orders: WorkOrder[]): WorkOrder[] {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const startOfTodayMs = startOfToday.getTime()

  return [...orders].sort((a, b) => {
    const scoreA = getOrderScore(a, startOfTodayMs)
    const scoreB = getOrderScore(b, startOfTodayMs)
    if (scoreB !== scoreA) return scoreB - scoreA
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })
}
