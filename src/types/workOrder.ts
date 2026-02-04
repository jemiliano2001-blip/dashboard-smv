/**
 * Priority levels for work orders
 */
export type Priority = 'low' | 'normal' | 'high' | 'critical'

/**
 * Status values for work orders
 */
export type Status = 'scheduled' | 'production' | 'quality' | 'hold'

/**
 * Work order entity representing a manufacturing order
 * 
 * @property id - Unique identifier (UUID)
 * @property company_name - Name of the company placing the order
 * @property po_number - Purchase order number
 * @property part_name - Name of the part being manufactured
 * @property quantity_total - Total quantity to produce
 * @property quantity_completed - Quantity already completed
 * @property priority - Priority level of the order
 * @property status - Current status of the order
 * @property created_at - ISO 8601 timestamp of creation
 */
export interface WorkOrder {
  /** Unique identifier (UUID v4) */
  id: string
  /** Company name (max 200 characters) */
  company_name: string
  /** Purchase order number (max 100 characters) */
  po_number: string
  /** Part name (max 200 characters) */
  part_name: string
  /** Total quantity to produce (non-negative integer) */
  quantity_total: number
  /** Quantity completed (non-negative integer, <= quantity_total) */
  quantity_completed: number
  /** Priority level */
  priority: Priority
  /** Current status */
  status: Status
  /** ISO 8601 timestamp */
  created_at: string
}

/**
 * Form data structure for creating or editing work orders
 * All fields are required for form submission
 */
export interface WorkOrderFormData {
  company_name: string
  po_number: string
  part_name: string
  quantity_total: number
  quantity_completed: number
  priority: Priority
  status: Status
  created_at: string
}

/**
 * Input data for creating a new work order
 * created_at is optional and defaults to current timestamp if not provided
 */
export interface WorkOrderCreateInput {
  company_name: string
  po_number: string
  part_name: string
  quantity_total: number
  quantity_completed: number
  priority: Priority
  status: Status
  /** Optional ISO 8601 timestamp, defaults to current time */
  created_at?: string
}

/**
 * Input data for updating an existing work order
 * All fields are optional - only provided fields will be updated
 */
export interface WorkOrderUpdateInput {
  company_name?: string
  po_number?: string
  part_name?: string
  quantity_total?: number
  quantity_completed?: number
  priority?: Priority
  status?: Status
  created_at?: string
}

/**
 * Callback function type for work order edit events
 */
export type WorkOrderEditCallback = (order: WorkOrder) => void

/**
 * Callback function type for work order delete events
 */
export type WorkOrderDeleteCallback = (id: string) => void

/**
 * Callback function type for work order duplicate events
 */
export type WorkOrderDuplicateCallback = (order: WorkOrder) => void

/**
 * Callback function type for quick status changes
 */
export type WorkOrderStatusChangeCallback = (id: string, status: Status) => void

/**
 * Callback function type for quick priority changes
 */
export type WorkOrderPriorityChangeCallback = (id: string, priority: Priority) => void
