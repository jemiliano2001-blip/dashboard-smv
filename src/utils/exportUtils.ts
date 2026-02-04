/**
 * Utility functions for exporting data
 */

import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import type { WorkOrder, Priority, Status } from '../types'

const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Baja',
  normal: 'Normal',
  high: 'Alta',
  critical: 'Crítica',
}

const STATUS_LABELS: Record<Status, string> = {
  scheduled: 'Programada',
  production: 'En Producción',
  quality: 'Completada',
  hold: 'En Hold',
}

/**
 * Convert array of objects to CSV string
 * @param data - Array of objects to convert
 * @param columns - Array of column keys to include
 * @returns CSV string
 */
export function arrayToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: (keyof T)[] | null = null
): string {
  if (!data || data.length === 0) {
    return ''
  }

  // If columns not specified, use all keys from first object
  const headers = columns || (data[0] ? (Object.keys(data[0]) as (keyof T)[]) : [])
  
  // Escape CSV values (handle quotes and commas)
  const escapeCSV = (value: unknown): string => {
    if (value === null || value === undefined) {
      return ''
    }
    const stringValue = String(value)
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
  }

  // Create header row
  const headerRow = headers.map(escapeCSV).join(',')

  // Create data rows
  const dataRows = data.map((row) => {
    return headers.map((header) => escapeCSV(row[header])).join(',')
  })

  return [headerRow, ...dataRows].join('\n')
}

/**
 * Download data as CSV file
 * @param csvContent - CSV string content
 * @param filename - Name of the file (without extension)
 */
export function downloadCSV(csvContent: string, filename = 'export'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * Export work orders to CSV
 * @param orders - Array of work orders
 * @param filename - Optional filename (default: 'work_orders')
 */
export function exportWorkOrdersToCSV(orders: WorkOrder[], filename = 'work_orders'): void {
  const columns: (keyof WorkOrder)[] = [
    'id',
    'company_name',
    'po_number',
    'part_name',
    'quantity_total',
    'quantity_completed',
    'priority',
    'status',
    'created_at',
  ]

  // Format dates for CSV
  const formattedOrders = orders.map((order) => ({
    ...order,
    created_at: order.created_at ? new Date(order.created_at).toLocaleString('es-ES') : '',
  }))

  const csvContent = arrayToCSV(formattedOrders, columns)
  downloadCSV(csvContent, filename)
}

/**
 * Format date for display in CSV
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDateForCSV(date: string | Date | null | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('es-ES')
}

/**
 * Export work orders to PDF
 * @param orders - Array of work orders
 * @param filename - Optional filename (default: 'work_orders')
 * @param options - PDF export options
 */
export function exportWorkOrdersToPDF(
  orders: WorkOrder[],
  filename = 'work_orders',
  options: { landscape?: boolean; includeSummary?: boolean } = {}
): void {
  const { landscape = false, includeSummary = true } = options
  const doc = new jsPDF(landscape ? 'landscape' : 'portrait', 'mm', 'a4')
  
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const startY = 20
  let yPos = startY

  // Header
  doc.setFontSize(18)
  doc.setTextColor(59, 130, 246) // blue-500
  doc.text('Reporte de Órdenes de Trabajo', margin, yPos)
  yPos += 10

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, margin, yPos)
  yPos += 15

  // Summary section
  if (includeSummary && orders.length > 0) {
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text('Resumen', margin, yPos)
    yPos += 8

    doc.setFontSize(10)
    const total = orders.length
    const inProduction = orders.filter((o) => o.status === 'production').length
    const completed = orders.filter((o) => o.status === 'quality').length
    const onHold = orders.filter((o) => o.status === 'hold').length
    const totalQuantity = orders.reduce((sum, o) => sum + (o.quantity_total || 0), 0)
    const completedQuantity = orders.reduce((sum, o) => sum + (o.quantity_completed || 0), 0)
    const progress = totalQuantity > 0 ? Math.round((completedQuantity / totalQuantity) * 100) : 0

    doc.text(`Total de órdenes: ${total}`, margin, yPos)
    yPos += 6
    doc.text(`En producción: ${inProduction}`, margin, yPos)
    yPos += 6
    doc.text(`Completadas: ${completed}`, margin, yPos)
    yPos += 6
    doc.text(`En hold: ${onHold}`, margin, yPos)
    yPos += 6
    doc.text(`Progreso general: ${progress}% (${completedQuantity.toLocaleString()} / ${totalQuantity.toLocaleString()})`, margin, yPos)
    yPos += 15
  }

  // Table headers
  if (orders.length > 0) {
    doc.setFontSize(11)
    doc.setTextColor(0, 0, 0)
    doc.setFont(undefined, 'bold')
    
    const headers = ['Compañía', 'PO', 'Pieza', 'Total', 'Completado', 'Prioridad', 'Estado']
    const colWidths = landscape ? [35, 30, 50, 20, 20, 25, 30] : [40, 30, 40, 18, 18, 22, 25]
    let xPos = margin

    headers.forEach((header, index) => {
      doc.text(header, xPos, yPos)
      xPos += colWidths[index]
    })

    yPos += 8
    doc.setFont(undefined, 'normal')
    doc.setFontSize(9)

    // Table rows
    orders.forEach((order, index) => {
      if (yPos > pageHeight - 30) {
        doc.addPage()
        yPos = startY
      }

      xPos = margin
      const rowData = [
        order.company_name || '',
        order.po_number || '',
        order.part_name || '',
        String(order.quantity_total || 0),
        String(order.quantity_completed || 0),
        PRIORITY_LABELS[order.priority] || order.priority,
        STATUS_LABELS[order.status] || order.status,
      ]

      rowData.forEach((cell, cellIndex) => {
        const cellText = String(cell).substring(0, 30)
        doc.text(cellText, xPos, yPos)
        xPos += colWidths[cellIndex]
      })

      yPos += 6

      // Add separator line
      if (index < orders.length - 1) {
        doc.setDrawColor(200, 200, 200)
        doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2)
      }
    })
  } else {
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('No hay órdenes para mostrar', margin, yPos)
  }

  // Footer
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
  }

  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`)
}

/**
 * Export work orders to Excel
 * @param orders - Array of work orders
 * @param filename - Optional filename (default: 'work_orders')
 */
export function exportWorkOrdersToExcel(orders: WorkOrder[], filename = 'work_orders'): void {
  const workbook = XLSX.utils.book_new()

  // Summary sheet
  const summaryData = [
    ['Resumen de Órdenes de Trabajo'],
    [''],
    ['Generado:', new Date().toLocaleString('es-ES')],
    [''],
    ['Métrica', 'Valor'],
    ['Total de órdenes', orders.length],
    [
      'En producción',
      orders.filter((o) => o.status === 'production').length,
    ],
    ['Completadas', orders.filter((o) => o.status === 'quality').length],
    ['En hold', orders.filter((o) => o.status === 'hold').length],
    ['Programadas', orders.filter((o) => o.status === 'scheduled').length],
    [
      'Cantidad total',
      orders.reduce((sum, o) => sum + (o.quantity_total || 0), 0),
    ],
    [
      'Cantidad completada',
      orders.reduce((sum, o) => sum + (o.quantity_completed || 0), 0),
    ],
    [
      'Progreso general %',
      orders.reduce((sum, o) => sum + (o.quantity_total || 0), 0) > 0
        ? Math.round(
            (orders.reduce((sum, o) => sum + (o.quantity_completed || 0), 0) /
              orders.reduce((sum, o) => sum + (o.quantity_total || 0), 0)) *
              100
          )
        : 0,
    ],
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen')

  // Detailed data sheet
  const formattedOrders = orders.map((order) => ({
    'ID': order.id,
    'Compañía': order.company_name || '',
    'Número PO': order.po_number || '',
    'Nombre Pieza': order.part_name || '',
    'Cantidad Total': order.quantity_total || 0,
    'Cantidad Completada': order.quantity_completed || 0,
    'Progreso %': order.quantity_total > 0
      ? Math.round((order.quantity_completed / order.quantity_total) * 100)
      : 0,
    'Prioridad': PRIORITY_LABELS[order.priority] || order.priority,
    'Estado': STATUS_LABELS[order.status] || order.status,
    'Fecha Creación': order.created_at
      ? new Date(order.created_at).toLocaleString('es-ES')
      : '',
  }))

  const dataSheet = XLSX.utils.json_to_sheet(formattedOrders)
  
  // Set column widths
  const colWidths = [
    { wch: 36 }, // ID
    { wch: 20 }, // Compañía
    { wch: 15 }, // Número PO
    { wch: 30 }, // Nombre Pieza
    { wch: 15 }, // Cantidad Total
    { wch: 18 }, // Cantidad Completada
    { wch: 12 }, // Progreso %
    { wch: 12 }, // Prioridad
    { wch: 15 }, // Estado
    { wch: 20 }, // Fecha Creación
  ]
  dataSheet['!cols'] = colWidths

  // Apply conditional formatting (colors based on priority and status)
  const range = XLSX.utils.decode_range(dataSheet['!ref'] || 'A1')
  
  // Add header styling
  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '3B82F6' } },
    alignment: { horizontal: 'center', vertical: 'center' },
  }

  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
    if (!dataSheet[cellAddress]) continue
    dataSheet[cellAddress].s = headerStyle
  }

  XLSX.utils.book_append_sheet(workbook, dataSheet, 'Órdenes Detalladas')

  // Priority distribution sheet
  const priorityData = [
    ['Distribución por Prioridad'],
    [''],
    ['Prioridad', 'Cantidad', 'Porcentaje'],
    ...Object.entries(
      orders.reduce<Record<Priority, number>>(
        (acc, order) => {
          acc[order.priority] = (acc[order.priority] || 0) + 1
          return acc
        },
        { low: 0, normal: 0, high: 0, critical: 0 }
      )
    ).map(([priority, count]) => [
      PRIORITY_LABELS[priority as Priority],
      count,
      orders.length > 0 ? Math.round((count / orders.length) * 100) : 0,
    ]),
  ]

  const prioritySheet = XLSX.utils.aoa_to_sheet(priorityData)
  XLSX.utils.book_append_sheet(workbook, prioritySheet, 'Por Prioridad')

  // Company stats sheet
  const companyStats = orders.reduce<Record<string, { total: number; completed: number; inProduction: number; onHold: number }>>(
    (acc, order) => {
      const company = order.company_name || 'Sin Compañía'
      if (!acc[company]) {
        acc[company] = { total: 0, completed: 0, inProduction: 0, onHold: 0 }
      }
      acc[company].total++
      if (order.status === 'quality') acc[company].completed++
      if (order.status === 'production') acc[company].inProduction++
      if (order.status === 'hold') acc[company].onHold++
      return acc
    },
    {}
  )

  const companyData = [
    ['Estadísticas por Compañía'],
    [''],
    ['Compañía', 'Total', 'Completadas', 'En Producción', 'En Hold'],
    ...Object.entries(companyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([company, stats]) => [company, stats.total, stats.completed, stats.inProduction, stats.onHold]),
  ]

  const companySheet = XLSX.utils.aoa_to_sheet(companyData)
  XLSX.utils.book_append_sheet(workbook, companySheet, 'Por Compañía')

  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`)
}
