import { useMemo } from 'react'
import { useWorkOrders } from '../hooks/useWorkOrders'
import { formatDate } from '../utils/dateFormatter'
import { formatPoForDisplay } from '../utils/formatUtils'
import type { WorkOrder } from '../types'

interface PrintViewProps {
  orders: WorkOrder[]
  title?: string
}

export function PrintView({ orders, title = 'Reporte de Órdenes de Trabajo' }: PrintViewProps) {
  const stats = useMemo(() => {
    const total = orders.length
    const inProduction = orders.filter((o) => o.status === 'production').length
    const completed = orders.filter((o) => o.status === 'quality').length
    const onHold = orders.filter((o) => o.status === 'hold').length
    const totalQuantity = orders.reduce((sum, o) => sum + (o.quantity_total || 0), 0)
    const completedQuantity = orders.reduce((sum, o) => sum + (o.quantity_completed || 0), 0)
    const progress = totalQuantity > 0 ? Math.round((completedQuantity / totalQuantity) * 100) : 0

    return {
      total,
      inProduction,
      completed,
      onHold,
      totalQuantity,
      completedQuantity,
      progress,
    }
  }, [orders])

  return (
    <div className="print-view">
      <div className="print-header">
        <h1>{title}</h1>
        <p>Generado: {new Date().toLocaleString('es-ES')}</p>
      </div>

      <div className="print-summary">
        <h2>Resumen</h2>
        <table>
          <tbody>
            <tr>
              <td>Total de órdenes:</td>
              <td>{stats.total}</td>
            </tr>
            <tr>
              <td>En producción:</td>
              <td>{stats.inProduction}</td>
            </tr>
            <tr>
              <td>Completadas:</td>
              <td>{stats.completed}</td>
            </tr>
            <tr>
              <td>En hold:</td>
              <td>{stats.onHold}</td>
            </tr>
            <tr>
              <td>Progreso general:</td>
              <td>{stats.progress}% ({stats.completedQuantity.toLocaleString()} / {stats.totalQuantity.toLocaleString()})</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="print-orders">
        <h2>Órdenes Detalladas</h2>
        <table>
          <thead>
            <tr>
              <th>Compañía</th>
              <th>PO Number</th>
              <th>Pieza</th>
              <th>Cantidad Total</th>
              <th>Cantidad Completada</th>
              <th>Progreso</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Fecha Creación</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const progress =
                order.quantity_total > 0
                  ? Math.round((order.quantity_completed / order.quantity_total) * 100)
                  : 0

              return (
                <tr key={order.id}>
                  <td>{order.company_name}</td>
                  <td>{formatPoForDisplay(order.po_number)}</td>
                  <td>{order.part_name}</td>
                  <td>{order.quantity_total}</td>
                  <td>{order.quantity_completed}</td>
                  <td>{progress}%</td>
                  <td>{order.priority}</td>
                  <td>{order.status}</td>
                  <td>{formatDate(order.created_at)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="print-footer">
        <p>Página 1 - Generado por TV Dashboard Visual Factory</p>
      </div>
    </div>
  )
}
