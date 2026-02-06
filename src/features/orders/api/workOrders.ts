/**
 * API layer for work orders operations
 * Abstracts Supabase calls for use with React Query
 */

import { supabase } from '@/lib/supabase'
import type { WorkOrder, WorkOrderFormData, WorkOrderCreateInput } from '@/types'

/**
 * Fetch all work orders from Supabase
 */
export async function fetchWorkOrders(): Promise<WorkOrder[]> {
  const { data, error } = await supabase
    .from('work_orders')
    .select('*')
    .order('company_name', { ascending: true })
    .order('priority', { ascending: false })

  if (error) {
    throw new Error(error.message || 'Error al obtener las órdenes')
  }

  return (data as WorkOrder[]) || []
}

/**
 * Fetch a single work order by ID
 */
export async function fetchWorkOrderById(id: string): Promise<WorkOrder> {
  const { data, error } = await supabase
    .from('work_orders')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message || 'Error al obtener la orden')
  }

  return data as WorkOrder
}

/**
 * Create a new work order
 */
export async function createWorkOrder(orderData: WorkOrderFormData): Promise<WorkOrder> {
  const insertData: Record<string, unknown> = {
    company_name: orderData.company_name,
    po_number: orderData.po_number,
    part_name: orderData.part_name,
    quantity_total: orderData.quantity_total,
    quantity_completed: orderData.quantity_completed,
    priority: orderData.priority,
    status: orderData.status,
    created_at: orderData.created_at,
  }

  const { data, error } = await supabase
    .from('work_orders')
    .insert([insertData])
    .select()
    .single()

  if (error) {
    throw new Error(error.message || 'Error al crear la orden')
  }

  return data as WorkOrder
}

/**
 * Update an existing work order
 */
export async function updateWorkOrder(id: string, orderData: WorkOrderFormData): Promise<WorkOrder> {
  const updateData: Record<string, unknown> = {
    company_name: orderData.company_name,
    po_number: orderData.po_number,
    part_name: orderData.part_name,
    quantity_total: orderData.quantity_total,
    quantity_completed: orderData.quantity_completed,
    priority: orderData.priority,
    status: orderData.status,
    created_at: orderData.created_at,
  }

  const { data, error } = await supabase
    .from('work_orders')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message || 'Error al actualizar la orden')
  }

  return data as WorkOrder
}

/**
 * Delete a work order
 */
export async function deleteWorkOrder(id: string): Promise<void> {
  const { error } = await supabase
    .from('work_orders')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message || 'Error al eliminar la orden')
  }
}

/**
 * Update work order status
 */
export async function updateWorkOrderStatus(id: string, status: WorkOrder['status']): Promise<WorkOrder> {
  const { data, error } = await supabase
    .from('work_orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message || 'Error al actualizar el estado')
  }

  return data as WorkOrder
}

/**
 * Update work order priority
 */
export async function updateWorkOrderPriority(id: string, priority: WorkOrder['priority']): Promise<WorkOrder> {
  const { data, error } = await supabase
    .from('work_orders')
    .update({ priority })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message || 'Error al actualizar la prioridad')
  }

  return data as WorkOrder
}

const BULK_INSERT_CHUNK_SIZE = 50

export interface InsertWorkOrdersBulkResult {
  inserted: number
  errors: string[]
}

function toInsertPayload(order: WorkOrderCreateInput): Record<string, unknown> {
  return {
    company_name: order.company_name,
    po_number: order.po_number,
    part_name: order.part_name,
    quantity_total: order.quantity_total,
    quantity_completed: order.quantity_completed ?? 0,
    priority: order.priority ?? 'normal',
    status: order.status ?? 'scheduled',
    created_at: order.created_at ?? new Date().toISOString(),
  }
}

/**
 * Insert multiple work orders in chunks (bulk upload).
 * Accumulates inserted count and errors per chunk.
 */
export async function insertWorkOrdersBulk(
  data: WorkOrderCreateInput[]
): Promise<InsertWorkOrdersBulkResult> {
  if (data.length === 0) {
    return { inserted: 0, errors: [] }
  }

  let totalInserted = 0
  const errors: string[] = []

  for (let offset = 0; offset < data.length; offset += BULK_INSERT_CHUNK_SIZE) {
    const chunk = data.slice(offset, offset + BULK_INSERT_CHUNK_SIZE)
    const payload = chunk.map(toInsertPayload)
    const startRow = offset + 1
    const endRow = offset + chunk.length
    const chunkLabel =
      data.length > BULK_INSERT_CHUNK_SIZE
        ? `Lote ${Math.floor(offset / BULK_INSERT_CHUNK_SIZE) + 1} (filas ${startRow}–${endRow})`
        : ''

    const { data: inserted, error } = await supabase
      .from('work_orders')
      .insert(payload)
      .select('id')

    if (error) {
      const msg = chunkLabel
        ? `${chunkLabel}: ${error.message || 'Error al insertar órdenes'}`
        : error.message || 'Error al insertar órdenes'
      errors.push(msg)
      continue
    }

    totalInserted += Array.isArray(inserted) ? inserted.length : 0
  }

  return { inserted: totalInserted, errors }
}
