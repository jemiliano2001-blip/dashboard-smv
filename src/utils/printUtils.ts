import { escapeHtml } from '@/utils/sanitize'
import type { WorkOrder } from '@/types'

export function generateWorkOrdersPrintHTML(orders: WorkOrder[]): string {
  const inProductionCount = orders.filter((o) => o.status === 'production').length
  const completedCount = orders.filter((o) => o.status === 'quality').length
  const generatedDate = new Date().toLocaleString('es-ES')

  const tableRows = orders
    .map((order) => {
      const progress =
        order.quantity_total > 0
          ? Math.round((order.quantity_completed / order.quantity_total) * 100)
          : 0

      return `
          <tr>
            <td>${escapeHtml(order.company_name || '')}</td>
            <td>${escapeHtml(order.po_number || '')}</td>
            <td>${escapeHtml(order.part_name || '')}</td>
            <td>${order.quantity_total}</td>
            <td>${order.quantity_completed}</td>
            <td>${progress}%</td>
            <td>${escapeHtml(order.priority)}</td>
            <td>${escapeHtml(order.status)}</td>
          </tr>
        `
    })
    .join('')

  return `
      <div class="print-header">
        <h1>Reporte de Órdenes de Trabajo</h1>
        <p>Generado: ${escapeHtml(generatedDate)}</p>
      </div>
      <div class="print-summary">
        <h2>Resumen</h2>
        <p>Total: ${orders.length} | En producción: ${inProductionCount} | Completadas: ${completedCount}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Compañía</th>
            <th>PO Number</th>
            <th>Pieza</th>
            <th>Total</th>
            <th>Completado</th>
            <th>Progreso</th>
            <th>Prioridad</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      <div class="print-footer">
        <p>Página 1 - Generado por TV Dashboard Visual Factory</p>
      </div>
    `
}

export function openPrintWindow(html: string): void {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const fullHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reporte de Órdenes de Trabajo</title>
          <style>
            @page { margin: 1cm; size: A4; }
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .print-header { margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #000; }
            .print-footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 10px; color: #666; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `

  printWindow.document.write(fullHTML)
  printWindow.document.close()

  setTimeout(() => {
    printWindow.print()
  }, 250)
}

