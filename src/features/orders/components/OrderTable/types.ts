import type { WorkOrder, Priority, Status } from '@/types'

export type SortColumn =
  | 'company_name'
  | 'po_number'
  | 'part_name'
  | 'created_at'
  | 'priority'
  | 'status'
  | 'quantity_total'
  | 'quantity_completed'
export type SortOrder = 'asc' | 'desc'

export interface AdvancedFilterState {
  searchFields: { poNumber: boolean; partName: boolean; companyName: boolean }
  dateRange: { start: string; end: string }
  priority: Priority | ''
  status: Status | ''
  company: string
  combineMode: 'AND' | 'OR'
}

export interface OrderTableProps {
  orders: WorkOrder[]
  onEdit: (order: WorkOrder) => void
  onDelete: (id: string) => void
  onDuplicate?: (order: WorkOrder) => void
  onQuickStatusChange?: (id: string, status: Status) => void
  onQuickPriorityChange?: (id: string, priority: Priority) => void
  loading?: boolean
}

export interface ConfirmDeleteState {
  isOpen: boolean
  orderId: string | null
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Baja',
  normal: 'Normal',
  high: 'Alta',
  critical: 'Crítica',
}

export const STATUS_LABELS: Record<Status, string> = {
  scheduled: 'Programada',
  production: 'En Producción',
  quality: 'Calidad',
  hold: 'En Hold',
}
