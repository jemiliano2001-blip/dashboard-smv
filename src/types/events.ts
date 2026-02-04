/**
 * Type definitions for event handlers and callbacks
 */

import type { WorkOrder, Priority, Status } from './workOrder'

/**
 * Generic event handler type
 */
export type EventHandler<T = void> = (event: T) => void

/**
 * Mouse event handler
 */
export type MouseEventHandler = EventHandler<React.MouseEvent<HTMLElement>>

/**
 * Change event handler for form inputs
 */
export type ChangeEventHandler = EventHandler<React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>>

/**
 * Form submit event handler
 */
export type FormSubmitHandler = EventHandler<React.FormEvent<HTMLFormElement>>

/**
 * Keyboard event handler
 */
export type KeyboardEventHandler = EventHandler<React.KeyboardEvent<HTMLElement>>

/**
 * Work order selection event
 */
export interface WorkOrderSelectionEvent {
  orderId: string
  selected: boolean
  allSelected: boolean
}

/**
 * Bulk action event
 */
export interface BulkActionEvent {
  orderIds: string[]
  action: 'delete' | 'export' | 'update'
}

/**
 * Filter change event
 */
export interface FilterChangeEvent {
  field: string
  value: unknown
  filters: Record<string, unknown>
}

/**
 * Sort change event
 */
export interface SortChangeEvent {
  column: string
  order: 'asc' | 'desc'
}
