import { useState, useRef, useCallback, useMemo, useEffect, ChangeEvent } from 'react'
import { List } from 'react-window'
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcuts'
import { useAppSettings } from '../../hooks/useAppSettings'
import { exportWorkOrdersToCSV } from '../../utils/exportUtils'
import { ConfirmDialog } from '../ConfirmDialog'
import { AdvancedFilters } from '../AdvancedFilters'
import { ColumnManager } from '../ColumnManager'
import { QuickActionsMenu } from '../QuickActionsMenu'
import { BulkActionsBar } from '../BulkActionsBar'
import { OrderTableHeader } from './OrderTableHeader'
import { OrderTableRow } from './OrderTableRow'
import { OrderTableFilters } from './OrderTableFilters'
import { OrderTablePagination } from './OrderTablePagination'
import { OrderTableToolbar } from './OrderTableToolbar'
import { useOrderTableFilters } from './hooks/useOrderTableFilters'
import { useOrderTableSort } from './hooks/useOrderTableSort'
import { useOrderTablePagination } from './hooks/useOrderTablePagination'
import type { OrderTableProps, AdvancedFilterState, ConfirmDeleteState } from './types'
import type { WorkOrder } from '../../types'

function highlightText(text: string, searchTerm: string): JSX.Element {
  if (!searchTerm || !text) {
    return <>{text}</>
  }

  const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'))
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === searchTerm.toLowerCase() ? (
          <mark key={index} className="bg-yellow-400 text-yellow-900 px-1 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}

export function OrderTable({
  orders,
  onEdit,
  onDelete,
  onDuplicate,
  onQuickStatusChange,
  onQuickPriorityChange,
  loading = false,
}: OrderTableProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { settings } = useAppSettings()
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState>({ isOpen: false, orderId: null })
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterState | null>(null)
  const [columnManagerOpen, setColumnManagerOpen] = useState(false)
  const [quickMenuOpen, setQuickMenuOpen] = useState<{ order: WorkOrder; position: { x: number; y: number } } | null>(null)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)

  const {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    filterCompany,
    setFilterCompany,
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    companies,
    matchesFilters,
  } = useOrderTableFilters({ orders, advancedFilters })

  const {
    sortBy,
    sortOrder,
    handleSort,
    sortedOrders: sortedOrdersFromHook,
  } = useOrderTableSort({
    orders,
    defaultSortColumn: settings.adminPanel.defaultSortColumn,
    defaultSortOrder: settings.adminPanel.defaultSortOrder,
  })

  const filteredOrders = useMemo(() => {
    return sortedOrdersFromHook.filter(matchesFilters)
  }, [sortedOrdersFromHook, matchesFilters])

  const {
    currentPage,
    itemsPerPage,
    totalPages,
    paginatedItems,
    handlePageChange,
    handleItemsPerPageChange,
  } = useOrderTablePagination({
    totalItems: filteredOrders.length,
    defaultItemsPerPage: settings.adminPanel.defaultItemsPerPage,
  })


  const paginatedOrders = useMemo(() => {
    return filteredOrders.slice(paginatedItems.start, paginatedItems.end)
  }, [filteredOrders, paginatedItems])

  useKeyboardShortcut('ctrl+k', (e) => {
    e.preventDefault()
    searchInputRef.current?.focus()
  })

  useKeyboardShortcut('cmd+k', (e) => {
    e.preventDefault()
    searchInputRef.current?.focus()
  })

  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }, [setSearchTerm])

  const handleDeleteClick = useCallback((id: string) => {
    setConfirmDelete({ isOpen: true, orderId: id })
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (confirmDelete.orderId) {
      onDelete(confirmDelete.orderId)
      setConfirmDelete({ isOpen: false, orderId: null })
    }
  }, [confirmDelete.orderId, onDelete])

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedOrders(new Set(filteredOrders.map((order) => order.id)))
    } else {
      setSelectedOrders(new Set())
    }
  }, [filteredOrders])

  const handleSelectOrder = useCallback((orderId: string, checked: boolean) => {
    const newSelected = new Set(selectedOrders)
    if (checked) {
      newSelected.add(orderId)
    } else {
      newSelected.delete(orderId)
    }
    setSelectedOrders(newSelected)
  }, [selectedOrders])

  const handleBulkDelete = useCallback(() => {
    if (selectedOrders.size === 0) return
    setConfirmBulkDelete(true)
  }, [selectedOrders])

  const handleConfirmBulkDelete = useCallback(() => {
    selectedOrders.forEach((id) => onDelete(id))
    setSelectedOrders(new Set())
    setConfirmBulkDelete(false)
  }, [selectedOrders, onDelete])

  const handleExport = useCallback(() => {
    const filename = filteredOrders.length > 0 
      ? `work_orders_${new Date().toISOString().split('T')[0]}`
      : 'work_orders'
    exportWorkOrdersToCSV(filteredOrders, filename)
  }, [filteredOrders])

  const handleExportSelected = useCallback(() => {
    if (selectedOrders.size === 0) return
    const selected = orders.filter((order) => selectedOrders.has(order.id))
    const filename = `work_orders_selected_${new Date().toISOString().split('T')[0]}`
    exportWorkOrdersToCSV(selected, filename)
    setSelectedOrders(new Set())
  }, [selectedOrders, orders])

  const handleBulkActionComplete = useCallback(() => {
    setSelectedOrders(new Set())
  }, [])

  const handleSelectionClear = useCallback(() => {
    setSelectedOrders(new Set())
  }, [])

  const handleRowContextMenu = useCallback((e: React.MouseEvent<HTMLTableRowElement>, order: WorkOrder) => {
    if (!settings.adminPanel.quickActionsEnabled) return
    e.preventDefault()
    setQuickMenuOpen({
      order,
      position: { x: e.clientX, y: e.clientY },
    })
  }, [settings.adminPanel.quickActionsEnabled])

  const allSelected = filteredOrders.length > 0 && selectedOrders.size === filteredOrders.length
  const someSelected = selectedOrders.size > 0 && selectedOrders.size < filteredOrders.length

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 h-full flex flex-col">
      <OrderTableFilters
        searchTerm={searchTerm}
        searchInputRef={searchInputRef}
        onSearchChange={handleSearchChange}
        filterCompany={filterCompany}
        filterStatus={filterStatus}
        filterPriority={filterPriority}
        companies={companies}
        onCompanyChange={setFilterCompany}
        onStatusChange={setFilterStatus}
        onPriorityChange={setFilterPriority}
        onAdvancedFiltersClick={() => setAdvancedFiltersOpen(true)}
        onExportClick={handleExport}
        hasAdvancedFilters={advancedFilters !== null}
        filteredCount={filteredOrders.length}
        totalCount={orders.length}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
      />

      <div className="flex items-center justify-between mb-4">
        <OrderTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
        <OrderTableToolbar
          bulkOperationsEnabled={settings.adminPanel.bulkOperationsEnabled}
          selectedCount={selectedOrders.size}
          onExportSelected={handleExportSelected}
          onBulkDelete={handleBulkDelete}
          onColumnManagerClick={() => setColumnManagerOpen(true)}
        />
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full min-w-[800px] table-fixed">
            <OrderTableHeader
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              bulkOperationsEnabled={settings.adminPanel.bulkOperationsEnabled}
              onSelectAll={handleSelectAll}
              allSelected={allSelected}
              someSelected={someSelected}
            />
          </table>
        </div>
        {filteredOrders.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm font-medium">
            No se encontraron órdenes
          </div>
        ) : filteredOrders.length > 50 ? (
          <div className="flex-1">
            <List
              rowCount={filteredOrders.length}
              rowHeight={60}
              rowProps={{}}
              rowComponent={({ index, style }) => {
                const order = filteredOrders[index]
                if (!order) return null

                return (
                  <div style={style} className="border-b border-slate-700">
                    <table className="w-full table-fixed">
                      <tbody>
                        <OrderTableRow
                          order={order}
                          isSelected={selectedOrders.has(order.id)}
                          searchTerm={debouncedSearchTerm}
                          bulkOperationsEnabled={settings.adminPanel.bulkOperationsEnabled}
                          quickActionsEnabled={settings.adminPanel.quickActionsEnabled}
                          loading={loading}
                          onSelect={handleSelectOrder}
                          onEdit={onEdit}
                          onDelete={handleDeleteClick}
                          onQuickMenu={handleRowContextMenu}
                          highlightText={highlightText}
                        />
                      </tbody>
                    </table>
                  </div>
                )
              }}
              style={{ height: 600 }}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-auto -mx-2 px-2">
            <table className="w-full min-w-[800px] table-fixed">
              <tbody>
                {paginatedOrders.map((order) => (
                  <OrderTableRow
                    key={order.id}
                    order={order}
                    isSelected={selectedOrders.has(order.id)}
                    searchTerm={debouncedSearchTerm}
                    bulkOperationsEnabled={settings.adminPanel.bulkOperationsEnabled}
                    quickActionsEnabled={settings.adminPanel.quickActionsEnabled}
                    loading={loading}
                    onSelect={handleSelectOrder}
                    onEdit={onEdit}
                    onDelete={handleDeleteClick}
                    onQuickMenu={handleRowContextMenu}
                    highlightText={highlightText}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, orderId: null })}
        onConfirm={handleConfirmDelete}
        title="Eliminar Orden"
        message="¿Estás seguro de que deseas eliminar esta orden? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
      <ConfirmDialog
        isOpen={confirmBulkDelete}
        onClose={() => setConfirmBulkDelete(false)}
        onConfirm={handleConfirmBulkDelete}
        title="Eliminar Órdenes"
        message={`¿Estás seguro de que deseas eliminar ${selectedOrders.size} orden(es)? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
      <AdvancedFilters
        isOpen={advancedFiltersOpen}
        onClose={() => setAdvancedFiltersOpen(false)}
        onApply={(filters) => {
          setAdvancedFilters(filters)
          setFilterCompany(filters.company)
          setFilterStatus(filters.status)
          setFilterPriority(filters.priority)
        }}
        companies={companies}
        currentFilters={advancedFilters || undefined}
      />

      <ColumnManager
        isOpen={columnManagerOpen}
        onClose={() => setColumnManagerOpen(false)}
        onColumnsChange={() => {}}
      />

      {quickMenuOpen && settings.adminPanel.quickActionsEnabled && (
        <QuickActionsMenu
          order={quickMenuOpen.order}
          position={quickMenuOpen.position}
          onClose={() => setQuickMenuOpen(null)}
          onEdit={onEdit}
          onDelete={(id) => {
            handleDeleteClick(id)
            setQuickMenuOpen(null)
          }}
          onDuplicate={onDuplicate}
          onQuickStatusChange={(id, status) => {
            onQuickStatusChange?.(id, status)
            setQuickMenuOpen(null)
          }}
          onQuickPriorityChange={(id, priority) => {
            onQuickPriorityChange?.(id, priority)
            setQuickMenuOpen(null)
          }}
        />
      )}

      {settings.adminPanel.bulkOperationsEnabled && (
        <BulkActionsBar
          selectedIds={selectedOrders}
          onSelectionClear={handleSelectionClear}
          onActionComplete={handleBulkActionComplete}
        />
      )}
    </div>
  )
}
