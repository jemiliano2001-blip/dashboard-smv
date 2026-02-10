import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import {
  useWorkOrders,
  useWorkOrderActions,
  OrderForm,
  OrderTable,
  OrderHistory,
  BulkOrderUploader,
} from '@/features/orders'
import { useToast } from '../hooks/useToast'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useAppSettings } from '../hooks/useAppSettings'
import { SkeletonTable } from './SkeletonTable'
const SettingsPage = lazy(() =>
  import('@/features/settings').then((m) => ({ default: m.SettingsPage }))
)
import { LogsPanel } from './LogsPanel'
import { AdminMetrics } from './AdminMetrics'
import { Modal } from './Modal'
import { ToastContainer } from './Toast'
import { PageHeader } from '../layouts/PageHeader'
import { Plus, Download, FileText, FileSpreadsheet, History, Printer, Keyboard, BarChart3, Upload } from 'lucide-react'
import { LoadingState } from './LoadingState'
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal'
import { SUCCESS_MESSAGES } from '../utils/constants'
import { orderKeyByPo } from '../utils/formatUtils'
import { exportWorkOrdersToCSV, exportWorkOrdersToPDF, exportWorkOrdersToExcel } from '../utils/exportUtils'
import { escapeHtml } from '../utils/sanitize'
import type { WorkOrder, WorkOrderFormData, Priority, Status } from '../types'

export function AdminPanel() {
  const { workOrders, loading: ordersLoading, error: ordersError, refetch } = useWorkOrders()
  const {
    createOrder,
    updateOrder,
    deleteOrder,
    quickUpdateStatus,
    quickUpdatePriority,
    duplicateOrder,
    loading: actionLoading,
    error: actionError,
    success: actionSuccess,
    clearMessages,
  } = useWorkOrderActions()
  const { success: showSuccess, error: showError, toasts, removeToast } = useToast()
  const { settings } = useAppSettings()

  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)
  const [showMetrics, setShowMetrics] = useState(settings.adminPanel.showMetricsByDefault)
  const location = useLocation()

  // Auto-refresh based on settings
  useEffect(() => {
    if (settings.adminPanel.autoRefreshInterval > 0) {
      const interval = setInterval(() => {
        refetch()
      }, settings.adminPanel.autoRefreshInterval)

      return () => clearInterval(interval)
    }
    return undefined
  }, [settings.adminPanel.autoRefreshInterval, refetch])

  // Update showMetrics when settings change
  useEffect(() => {
    setShowMetrics(settings.adminPanel.showMetricsByDefault)
  }, [settings.adminPanel.showMetricsByDefault])

  useEffect(() => {
    if (actionSuccess) {
      showSuccess(actionSuccess)
      clearMessages()
    }
  }, [actionSuccess, showSuccess, clearMessages])

  useEffect(() => {
    if (actionError) {
      showError(actionError)
      clearMessages()
    }
  }, [actionError, showError, clearMessages])

  const handleSave = async (formData: WorkOrderFormData) => {
    if (editingOrder) {
      const updateResult = await updateOrder(editingOrder.id, formData)
      if (updateResult.success) {
        showSuccess(SUCCESS_MESSAGES.ORDER_UPDATED)
        setEditingOrder(null)
        setFormModalOpen(false)
      }
    } else {
      const createResult = await createOrder(formData)
      if (createResult.success) {
        showSuccess(SUCCESS_MESSAGES.ORDER_CREATED)
        setEditingOrder(null)
        setFormModalOpen(false)
      }
    }
  }

  const handleDuplicate = async (order: WorkOrder) => {
    const duplicateResult = await duplicateOrder(order.id)
    if (duplicateResult.success) {
      showSuccess('Orden duplicada exitosamente')
    }
  }

  const handleQuickStatusChange = async (id: string, status: Status) => {
    const result = await quickUpdateStatus(id, status)
    if (result.success) {
      showSuccess('Estado actualizado exitosamente')
    }
  }

  const handleQuickPriorityChange = async (id: string, priority: Priority) => {
    const result = await quickUpdatePriority(id, priority)
    if (result.success) {
      showSuccess('Prioridad actualizada exitosamente')
    }
  }

  const handleEdit = useCallback((order: WorkOrder) => {
    setEditingOrder(order)
    setFormModalOpen(true)
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    const deleteResult = await deleteOrder(id)
    if (deleteResult.success) {
      showSuccess(SUCCESS_MESSAGES.ORDER_DELETED)
      if (editingOrder?.id === id) {
        setEditingOrder(null)
        setFormModalOpen(false)
      }
    }
  }, [deleteOrder, showSuccess, editingOrder])

  const handleNewOrder = () => {
    setEditingOrder(null)
    setFormModalOpen(true)
  }

  const handleCancelForm = () => {
    setEditingOrder(null)
    setFormModalOpen(false)
  }

  const handleExportCSV = () => {
    const filename = `work_orders_all_${new Date().toISOString().split('T')[0]}`
    exportWorkOrdersToCSV(workOrders, filename)
    showSuccess('Órdenes exportadas a CSV exitosamente')
    setExportMenuOpen(false)
  }

  const handleExportPDF = () => {
    const filename = `work_orders_all_${new Date().toISOString().split('T')[0]}`
    exportWorkOrdersToPDF(workOrders, filename, { landscape: false, includeSummary: true })
    showSuccess('Órdenes exportadas a PDF exitosamente')
    setExportMenuOpen(false)
  }

  const handleExportExcel = () => {
    const filename = `work_orders_all_${new Date().toISOString().split('T')[0]}`
    exportWorkOrdersToExcel(workOrders, filename)
    showSuccess('Órdenes exportadas a Excel exitosamente')
    setExportMenuOpen(false)
  }

  const generatePrintHTML = (orders: WorkOrder[]): string => {
    const inProductionCount = orders.filter((o) => o.status === 'production').length
    const completedCount = orders.filter((o) => o.status === 'quality').length
    const generatedDate = new Date().toLocaleString('es-ES')

    const tableRows = orders
      .map((order) => {
        const progress = order.quantity_total > 0 
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

  const openPrintWindow = (html: string): void => {
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

  const handlePrint = () => {
    const printHTML = generatePrintHTML(workOrders)
    openPrintWindow(printHTML)
  }

  useKeyboardShortcuts(
    {
      'ctrl+n': (e) => {
        e.preventDefault()
        if (!formModalOpen) {
          handleNewOrder()
        }
      },
      'cmd+n': (e) => {
        e.preventDefault()
        if (!formModalOpen) {
          handleNewOrder()
        }
      },
      'escape': () => {
        if (formModalOpen) {
          handleCancelForm()
        }
      },
    },
    !ordersLoading
  )

  if (ordersLoading) {
    return <LoadingState />
  }

  if (ordersError) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center max-w-md p-8 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg">
          <div className="text-red-500 dark:text-red-400 text-xl font-bold mb-4">Error</div>
          <div className="text-zinc-600 dark:text-zinc-400 mb-6">{ordersError}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/20"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  const isManageOrdersView = location.pathname === '/admin' || location.pathname === '/admin/'
  const isLogsView = location.pathname === '/admin/logs'
  const isSettingsView = location.pathname === '/admin/settings'

  const getBreadcrumbs = () => {
    if (isManageOrdersView) {
      return [
        { label: 'Admin', path: '/admin' },
        { label: 'Manage Orders', path: '/admin' },
      ]
    }
    if (isLogsView) {
      return [
        { label: 'Admin', path: '/admin' },
        { label: 'Logs', path: '/admin/logs' },
      ]
    }
    if (isSettingsView) {
      return [
        { label: 'Admin', path: '/admin' },
        { label: 'Settings', path: '/admin/settings' },
      ]
    }
    return []
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <>
      <div className="flex-1 flex flex-col min-h-0">
        <header className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 md:px-8 py-4 md:py-6 shadow-sm">
          <PageHeader
            title={
              isManageOrdersView ? 'Órdenes' : isLogsView ? 'Registros del sistema' : 'Configuración'
            }
            description={
              isManageOrdersView
                ? 'Gestiona las órdenes de trabajo'
                : isLogsView
                  ? 'Registros de actividad del sistema'
                  : 'Configuración del sistema'
            }
            breadcrumbs={breadcrumbs}
            actions={
              <>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShortcutsOpen(true)}
                    className="p-2.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all duration-200 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                    title="Ver atajos de teclado"
                    aria-label="Ver atajos de teclado"
                  >
                    <Keyboard className="w-5 h-5" />
                  </button>
                </div>
                {isManageOrdersView && (
                  <>
                    <button
                      onClick={() => setShowMetrics(!showMetrics)}
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-xl transition-all duration-200 border border-zinc-200 dark:border-zinc-700"
                      title={showMetrics ? 'Ocultar métricas' : 'Mostrar métricas'}
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span className="hidden sm:inline">{showMetrics ? 'Ocultar' : 'Mostrar'} Métricas</span>
                    </button>
                    <div className="flex items-center gap-2 pl-0 md:pl-3 border-0 md:border-l border-zinc-200 dark:border-zinc-700">
                      <button
                        onClick={handlePrint}
                        className="p-2.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all duration-200 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                        title="Imprimir órdenes"
                        aria-label="Imprimir órdenes"
                      >
                        <Printer className="w-5 h-5" />
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setExportMenuOpen(!exportMenuOpen)}
                          className="flex items-center gap-2 px-3 md:px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl transition-all duration-200 border border-zinc-200 dark:border-zinc-700 text-sm md:text-base"
                          title="Exportar órdenes"
                          aria-label="Exportar órdenes"
                        >
                          <Download className="w-4 h-4" />
                          <span className="hidden sm:inline">Exportar</span>
                        </button>
                        {exportMenuOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setExportMenuOpen(false)}
                            />
                            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-20 overflow-hidden">
                              <button
                                onClick={handleExportCSV}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-200"
                              >
                                <Download className="w-4 h-4" />
                                Exportar CSV
                              </button>
                              <button
                                onClick={handleExportPDF}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-200 border-t border-zinc-200 dark:border-zinc-800"
                              >
                                <FileText className="w-4 h-4" />
                                Exportar PDF
                              </button>
                              <button
                                onClick={handleExportExcel}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-200 border-t border-zinc-200 dark:border-zinc-800"
                              >
                                <FileSpreadsheet className="w-4 h-4" />
                                Exportar Excel
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => setBulkUploadOpen(true)}
                        className="flex items-center gap-2 px-3 md:px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl transition-all duration-200 border border-zinc-200 dark:border-zinc-700 text-sm md:text-base"
                        title="Carga masiva"
                        aria-label="Carga masiva"
                      >
                        <Upload className="w-4 h-4" />
                        <span className="hidden sm:inline">Carga masiva</span>
                      </button>
                      <button
                        onClick={handleNewOrder}
                        className="flex items-center gap-2 px-4 md:px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/20 text-sm md:text-base"
                        aria-label="Crear nueva orden"
                      >
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">Nueva Orden</span>
                        <span className="sm:hidden">Nueva</span>
                      </button>
                    </div>
                  </>
                )}
              </>
            }
          />
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-8">
          <Routes>
            <Route
              index
              element={
                ordersLoading ? (
                  <SkeletonTable />
                ) : (
                  <>
                    {showMetrics && <AdminMetrics orders={workOrders} />}
                    <OrderTable
                      orders={workOrders}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onDuplicate={handleDuplicate}
                      onQuickStatusChange={handleQuickStatusChange}
                      onQuickPriorityChange={handleQuickPriorityChange}
                      loading={actionLoading}
                    />
                  </>
                )
              }
            />
            <Route path="logs" element={<LogsPanel />} />
            <Route
              path="settings"
              element={
                <Suspense fallback={<LoadingState />}>
                  <SettingsPage />
                </Suspense>
              }
            />
          </Routes>
        </main>
      </div>

      {/* Order Form Modal */}
      <Modal
        isOpen={formModalOpen}
        onClose={handleCancelForm}
        title={editingOrder ? 'Editar Orden' : 'Nueva Orden'}
        size="xl"
      >
        <div className="relative">
          {editingOrder && (
            <button
              onClick={() => setHistoryOpen(true)}
              className="absolute -top-2 -right-2 z-10 flex items-center gap-2 px-3 py-1.5 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg transition-colors text-sm"
              title="Ver historial de cambios"
            >
              <History className="w-4 h-4" />
              Historial
            </button>
          )}
          <OrderForm
            order={editingOrder}
            onSave={handleSave}
            onCancel={handleCancelForm}
            onDelete={handleDelete}
            loading={actionLoading}
          />
        </div>
      </Modal>

      {editingOrder && (
        <OrderHistory
          order={editingOrder}
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
        />
      )}
      <Modal
        isOpen={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        title="Carga masiva"
        size="xl"
      >
        <BulkOrderUploader
          existingOrderKeys={new Set(workOrders.map((o) => orderKeyByPo(o.company_name, o.po_number)))}
          onSuccess={() => {
            refetch()
            showSuccess('Órdenes agregadas correctamente')
          }}
          defaultCompanyName="Importación"
        />
      </Modal>
      <KeyboardShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  )
}
