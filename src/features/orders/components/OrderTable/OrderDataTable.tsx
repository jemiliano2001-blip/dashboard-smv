import { useState, useRef, useCallback, useMemo, useEffect, type ChangeEvent } from 'react'
import { List } from 'react-window'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
} from '@tanstack/react-table'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcuts'
import { useAppSettings } from '@/hooks/useAppSettings'
import { exportWorkOrdersToCSV } from '@/utils/exportUtils'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { AdvancedFilters } from '@/components/AdvancedFilters'
import { ColumnManager } from '@/components/ColumnManager'
import { QuickActionsMenu } from '@/components/QuickActionsMenu'
import { BulkActionsBar } from '@/components/BulkActionsBar'
import { OrderTableFilters } from '@/components/OrderTable/OrderTableFilters'
import { OrderTablePagination } from '@/components/OrderTable/OrderTablePagination'
import { OrderTableToolbar } from '@/components/OrderTable/OrderTableToolbar'
import { useOrderTableFilters } from '@/components/OrderTable/hooks/useOrderTableFilters'
import { useOrderTablePagination } from '@/components/OrderTable/hooks/useOrderTablePagination'
import { createColumns } from './columns'
import type { OrderTableProps, AdvancedFilterState } from './types'
import type { WorkOrder } from '@/types'

const VIRTUALIZATION_THRESHOLD = 50

export function OrderDataTable({
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
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; orderId: string | null }>({
    isOpen: false,
    orderId: null,
  })
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterState | null>(null)
  const [columnManagerOpen, setColumnManagerOpen] = useState(false)
  const [quickMenuOpen, setQuickMenuOpen] = useState<{
    order: WorkOrder
    position: { x: number; y: number }
  } | null>(null)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: settings.adminPanel.defaultSortColumn,
      desc: settings.adminPanel.defaultSortOrder === 'desc',
    },
  ])
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})

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

  const filteredOrders = useMemo(() => orders.filter(matchesFilters), [orders, matchesFilters])

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

  const paginatedOrders = useMemo(
    () => filteredOrders.slice(paginatedItems.start, paginatedItems.end),
    [filteredOrders, paginatedItems]
  )

  const tableData =
    filteredOrders.length > VIRTUALIZATION_THRESHOLD ? filteredOrders : paginatedOrders

  const callbacks = useMemo(
    () => ({
      onEdit,
      onDelete: (id: string) => setConfirmDelete({ isOpen: true, orderId: id }),
      onQuickMenu: (order: WorkOrder, position: { x: number; y: number }) =>
        setQuickMenuOpen({ order, position }),
      onDuplicate,
      onQuickStatusChange,
      onQuickPriorityChange,
    }),
    [onEdit, onDelete, onDuplicate, onQuickStatusChange, onQuickPriorityChange]
  )

  const columns = useMemo(
    () =>
      createColumns(callbacks, {
        bulkOperationsEnabled: settings.adminPanel.bulkOperationsEnabled,
        quickActionsEnabled: settings.adminPanel.quickActionsEnabled,
        loading,
        searchTerm: debouncedSearchTerm,
        density: 'compact',
      }),
    [
      callbacks,
      settings.adminPanel.bulkOperationsEnabled,
      settings.adminPanel.quickActionsEnabled,
      loading,
      debouncedSearchTerm,
    ]
  )

  const table = useReactTable({
    data: tableData,
    columns,
    getRowId: (row) => row.id,
    state: { sorting, rowSelection, columnVisibility },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

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

  const handleConfirmDelete = useCallback(() => {
    if (confirmDelete.orderId) {
      onDelete(confirmDelete.orderId)
      setConfirmDelete({ isOpen: false, orderId: null })
    }
  }, [confirmDelete.orderId, onDelete])

  const selectedIds = useMemo(() => {
    const ids = new Set<string>()
    Object.entries(rowSelection).forEach(([rowId, selected]) => {
      if (selected) ids.add(rowId)
    })
    return ids
  }, [rowSelection])

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return
    setConfirmBulkDelete(true)
  }, [selectedIds.size])

  const handleConfirmBulkDelete = useCallback(() => {
    selectedIds.forEach((id) => onDelete(id))
    setRowSelection({})
    setConfirmBulkDelete(false)
  }, [selectedIds, onDelete])

  const handleExport = useCallback(() => {
    const filename =
      filteredOrders.length > 0
        ? `work_orders_${new Date().toISOString().split('T')[0]}`
        : 'work_orders'
    exportWorkOrdersToCSV(filteredOrders, filename)
  }, [filteredOrders])

  const handleExportSelected = useCallback(() => {
    if (selectedIds.size === 0) return
    const selected = orders.filter((o) => selectedIds.has(o.id))
    const filename = `work_orders_selected_${new Date().toISOString().split('T')[0]}`
    exportWorkOrdersToCSV(selected, filename)
    setRowSelection({})
  }, [selectedIds, orders])

  const handleRowContextMenu = useCallback(
    (e: React.MouseEvent<HTMLTableRowElement>, order: WorkOrder) => {
      if (!settings.adminPanel.quickActionsEnabled) return
      e.preventDefault()
      setQuickMenuOpen({ order, position: { x: e.clientX, y: e.clientY } })
    },
    [settings.adminPanel.quickActionsEnabled]
  )

  const rows = table.getRowModel().rows

  return (
    <div className="bg-white/80 dark:bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 h-full flex flex-col shadow-sm">
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
          selectedCount={selectedIds.size}
          onExportSelected={handleExportSelected}
          onBulkDelete={handleBulkDelete}
          onColumnManagerClick={() => setColumnManagerOpen(true)}
        />
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full min-w-[800px] table-fixed">
            <thead className="sticky top-0 bg-zinc-50/95 dark:bg-zinc-900/95 backdrop-blur-md z-10 border-b border-zinc-200 dark:border-zinc-800">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort()
                    return (
                      <th
                        key={header.id}
                        className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider transition-colors"
                        style={{
                          width: header.getSize(),
                          ...(canSort && {
                            cursor: 'pointer',
                          }),
                        }}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      >
                        <div className="flex items-center gap-2">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && header.column.getIsSorted() && (
                            <span className="text-blue-400">
                              {header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
          </table>
        </div>
        {filteredOrders.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-sm font-medium">
            No se encontraron órdenes
          </div>
        ) : filteredOrders.length > VIRTUALIZATION_THRESHOLD ? (
          <div className="flex-1">
            <List
              rowCount={filteredOrders.length}
              rowHeight={52}
              rowProps={{
                rows: table.getRowModel().rows,
                handleRowContextMenu,
                flexRender,
              }}
              rowComponent={({ index, style, rows, handleRowContextMenu: onCtx, flexRender: fr }) => {
                const row = rows[index]
                if (!row) return null
                return (
                  <div style={style} className="border-b border-zinc-200 dark:border-zinc-700 group">
                    <table className="w-full table-fixed">
                      <tbody>
                        <tr
                          className={row.getIsSelected() ? 'bg-blue-500/10' : ''}
                          onContextMenu={(e) => onCtx(e, row.original)}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id}>{fr(cell.column.columnDef.cell, cell.getContext())}</td>
                          ))}
                        </tr>
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
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`group border-b border-zinc-200/50 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all ${
                      row.getIsSelected() ? 'bg-blue-500/10' : ''
                    }`}
                    onContextMenu={(e) => handleRowContextMenu(e, row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
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
        message={`¿Estás seguro de que deseas eliminar ${selectedIds.size} orden(es)? Esta acción no se puede deshacer.`}
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
        currentFilters={advancedFilters ?? undefined}
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
            setConfirmDelete({ isOpen: true, orderId: id })
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
          selectedIds={selectedIds}
          onSelectionClear={() => setRowSelection({})}
          onActionComplete={() => setRowSelection({})}
        />
      )}
    </div>
  )
}
