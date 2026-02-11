import { describe, it, expect } from 'vitest'
import { weightedSort } from '../weightedSort'
import type { WorkOrder } from '@/types'

const now = new Date()
const yesterday = new Date(now)
yesterday.setDate(yesterday.getDate() - 2)

const baseOrder: WorkOrder = {
  id: '1',
  company_name: 'A',
  po_number: 'PO1',
  part_name: 'Parte',
  quantity_total: 10,
  quantity_completed: 0,
  priority: 'normal',
  status: 'scheduled',
  created_at: now.toISOString(),
}

describe('weightedSort', () => {
  it('prioriza órdenes en hold o critical', () => {
    const orders: WorkOrder[] = [
      { ...baseOrder, id: '1', priority: 'normal', status: 'scheduled' },
      { ...baseOrder, id: '2', priority: 'critical', status: 'scheduled' },
      { ...baseOrder, id: '3', priority: 'high', status: 'production' },
    ]

    const sorted = weightedSort(orders)

    expect(sorted).toHaveLength(3)
    expect(sorted[0]!.id).toBe('2')
  })

  it('prioriza órdenes con status hold', () => {
    const orders: WorkOrder[] = [
      { ...baseOrder, id: '1', priority: 'normal', status: 'production' },
      { ...baseOrder, id: '2', priority: 'normal', status: 'hold' },
      { ...baseOrder, id: '3', priority: 'high', status: 'production' },
    ]

    const sorted = weightedSort(orders)

    // hold gets SCORE_ON_HOLD (1000), high gets SCORE_PRIORIDAD (500)
    expect(sorted[0]!.id).toBe('2')
    expect(sorted[1]!.id).toBe('3')
  })

  it('prioriza órdenes con "URGENTE" en part_name', () => {
    const orders: WorkOrder[] = [
      { ...baseOrder, id: '1', priority: 'normal', part_name: 'Pieza normal' },
      { ...baseOrder, id: '2', priority: 'normal', part_name: 'Pieza URGENTE' },
    ]

    const sorted = weightedSort(orders)

    expect(sorted[0]!.id).toBe('2')
  })

  it('detecta URGENTE en mayúsculas y minúsculas (toUpperCase)', () => {
    const orders: WorkOrder[] = [
      { ...baseOrder, id: '1', priority: 'normal', part_name: 'Normal' },
      { ...baseOrder, id: '2', priority: 'normal', part_name: 'urgente pedido' },
    ]

    const sorted = weightedSort(orders)

    expect(sorted[0]!.id).toBe('2')
  })

  it('boostea órdenes antiguas cuando prioritizeOldOrders está habilitado', () => {
    const orders: WorkOrder[] = [
      { ...baseOrder, id: '1', priority: 'high', created_at: now.toISOString() },
      { ...baseOrder, id: '2', priority: 'normal', created_at: yesterday.toISOString() },
    ]

    // Without prioritizeOldOrders: high (500) beats normal+overdue (0+50)
    const sorted1 = weightedSort(orders, { prioritizeOldOrders: false })
    expect(sorted1[0]!.id).toBe('1')

    // With prioritizeOldOrders: normal+overdue_boosted (0+800) beats high (500)
    const sorted2 = weightedSort(orders, { prioritizeOldOrders: true })
    expect(sorted2[0]!.id).toBe('2')
  })

  it('ordena por tamaño de part_name cuando groupBySize está habilitado', () => {
    const orders: WorkOrder[] = [
      { ...baseOrder, id: '1', part_name: 'ABCDE largo nombre pieza' },
      { ...baseOrder, id: '2', part_name: 'AB' },
      { ...baseOrder, id: '3', part_name: 'ABCDEF más largo aún' },
    ]

    const sorted = weightedSort(orders, { groupBySize: true })

    // Same score, shorter part_name first
    expect(sorted[0]!.id).toBe('2')
  })

  it('usa FIFO (created_at) para desempatar cuando scores son iguales', () => {
    const earlier = new Date(now)
    earlier.setHours(earlier.getHours() - 1)

    const orders: WorkOrder[] = [
      { ...baseOrder, id: '1', created_at: now.toISOString() },
      { ...baseOrder, id: '2', created_at: earlier.toISOString() },
    ]

    const sorted = weightedSort(orders)

    // Same score, earlier created_at first (FIFO)
    expect(sorted[0]!.id).toBe('2')
  })

  it('retorna array vacío para input vacío', () => {
    const sorted = weightedSort([])
    expect(sorted).toEqual([])
  })

  it('no muta el array original', () => {
    const orders: WorkOrder[] = [
      { ...baseOrder, id: '2', priority: 'critical' },
      { ...baseOrder, id: '1', priority: 'normal' },
    ]
    const original = [...orders]

    weightedSort(orders)

    expect(orders[0]!.id).toBe(original[0]!.id)
    expect(orders[1]!.id).toBe(original[1]!.id)
  })

  it('maneja órdenes con la misma prioridad y fecha', () => {
    const sameTime = now.toISOString()
    const orders: WorkOrder[] = [
      { ...baseOrder, id: '1', created_at: sameTime },
      { ...baseOrder, id: '2', created_at: sameTime },
    ]

    const sorted = weightedSort(orders)

    // Should not crash; order is stable
    expect(sorted).toHaveLength(2)
  })

  it('las órdenes overdue (antes de hoy) obtienen score adicional', () => {
    const orders: WorkOrder[] = [
      { ...baseOrder, id: '1', priority: 'normal', created_at: now.toISOString() },
      { ...baseOrder, id: '2', priority: 'normal', created_at: yesterday.toISOString() },
    ]

    const sorted = weightedSort(orders)

    // Yesterday's order gets SCORE_OVERDUE (50), today's gets 0
    expect(sorted[0]!.id).toBe('2')
  })

  it('critical + URGENTE combo obtiene score máximo', () => {
    const orders: WorkOrder[] = [
      { ...baseOrder, id: '1', priority: 'high', part_name: 'URGENTE pieza' },
      { ...baseOrder, id: '2', priority: 'critical', part_name: 'URGENTE pieza' },
    ]

    const sorted = weightedSort(orders)

    // critical+URGENTE (1000+100) > high+URGENTE (500+100)
    expect(sorted[0]!.id).toBe('2')
  })
})
