export type ChangeType = 'create' | 'update' | 'delete'

export interface WorkOrderHistory {
  id: string
  work_order_id: string
  changed_field: string
  old_value: string | null
  new_value: string | null
  changed_by: string | null
  change_type: ChangeType
  created_at: string
}

export interface OrderHistoryFilter {
  startDate?: string
  endDate?: string
  changeType?: ChangeType
  changedField?: string
}
