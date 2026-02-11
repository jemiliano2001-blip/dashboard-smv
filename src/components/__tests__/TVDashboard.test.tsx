import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mutable mock state that tests can change
const mockWorkOrdersState = {
  workOrders: [] as Array<{
    id: string
    company_name: string
    po_number: string
    part_name: string
    quantity_total: number
    quantity_completed: number
    priority: string
    status: string
    created_at: string
  }>,
  ordersByCompany: {} as Record<string, unknown[]>,
  companies: [] as string[],
  loading: false,
  error: null as string | null,
  refetch: vi.fn(),
}

vi.mock('@/features/orders', () => ({
  useWorkOrders: () => mockWorkOrdersState,
}))

vi.mock('../../hooks/useFullscreen', () => ({
  useFullscreen: () => ({ enterFullscreen: vi.fn() }),
}))

vi.mock('../../hooks/useSettings', () => ({
  useSettings: () => ({
    columnDensity: 'auto',
    ordersPerPage: 8,
    prioritizeOldOrders: false,
    groupBySize: false,
    companyRotation: 30,
    pageRotation: 15,
    fitToScreen: true,
    textSize: 'normal',
    autoRefreshInterval: 5,
  }),
}))

vi.mock('../Footer', () => ({
  Footer: () => <div data-testid="footer" />,
}))

vi.mock('../Header', () => ({
  Header: ({ companyName }: { companyName: string | null }) => (
    <div data-testid="header">{companyName}</div>
  ),
}))

vi.mock('../OrderCard', () => ({
  OrderCard: ({ order }: { order: { po_number: string } }) => (
    <div data-testid="order-card">{order.po_number}</div>
  ),
}))

vi.mock('../SkeletonCard', () => ({
  SkeletonCard: () => <div data-testid="skeleton-card" />,
}))

// Import after mocks are set up
import { TVDashboard } from '../TVDashboard'

function resetMockState() {
  mockWorkOrdersState.workOrders = []
  mockWorkOrdersState.ordersByCompany = {}
  mockWorkOrdersState.companies = []
  mockWorkOrdersState.loading = false
  mockWorkOrdersState.error = null
  mockWorkOrdersState.refetch = vi.fn()
}

describe('TVDashboard', () => {
  beforeEach(() => {
    resetMockState()
  })

  it('muestra mensaje cuando no hay órdenes', () => {
    render(<TVDashboard />)

    expect(
      screen.getByText(/No hay órdenes de trabajo/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/Esperando datos/i)).toBeInTheDocument()
  })

  it('muestra skeletons cuando está cargando', () => {
    mockWorkOrdersState.loading = true

    render(<TVDashboard />)

    const skeletons = screen.getAllByTestId('skeleton-card')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('muestra error de conexión cuando hay error string', () => {
    mockWorkOrdersState.error = 'Connection failed'

    render(<TVDashboard />)

    expect(screen.getByText(/Error de Conexión/i)).toBeInTheDocument()
    expect(screen.getByText(/Connection failed/i)).toBeInTheDocument()
    expect(screen.getByText(/Reintentar/i)).toBeInTheDocument()
  })

  it('muestra error genérico cuando el error no es string', () => {
    Object.assign(mockWorkOrdersState as Record<string, unknown>, { error: { message: 'obj error' } })

    render(<TVDashboard />)

    expect(screen.getByText(/Error al cargar los datos/i)).toBeInTheDocument()
  })

  it('renderiza OrderCards cuando hay órdenes', () => {
    const orders = [
      { id: '1', company_name: 'ACME', po_number: 'PO-001', part_name: 'Part A', quantity_total: 10, quantity_completed: 5, priority: 'normal', status: 'production', created_at: new Date().toISOString() },
      { id: '2', company_name: 'ACME', po_number: 'PO-002', part_name: 'Part B', quantity_total: 20, quantity_completed: 10, priority: 'high', status: 'scheduled', created_at: new Date().toISOString() },
    ]

    mockWorkOrdersState.workOrders = orders
    mockWorkOrdersState.ordersByCompany = { ACME: orders }
    mockWorkOrdersState.companies = ['ACME']

    render(<TVDashboard />)

    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
    const cards = screen.getAllByTestId('order-card')
    expect(cards.length).toBe(2)
  })

  it('muestra el botón de fullscreen', () => {
    const orders = [
      { id: '1', company_name: 'ACME', po_number: 'PO-001', part_name: 'Part A', quantity_total: 10, quantity_completed: 5, priority: 'normal', status: 'production', created_at: new Date().toISOString() },
    ]

    mockWorkOrdersState.workOrders = orders
    mockWorkOrdersState.ordersByCompany = { ACME: orders }
    mockWorkOrdersState.companies = ['ACME']

    render(<TVDashboard />)

    expect(screen.getByLabelText(/pantalla completa/i)).toBeInTheDocument()
  })

  it('muestra botón de reintentar en estado de error', () => {
    mockWorkOrdersState.error = 'Some error'

    render(<TVDashboard />)

    const retryButton = screen.getByLabelText(/Reintentar conexión/i)
    expect(retryButton).toBeInTheDocument()
  })
})
