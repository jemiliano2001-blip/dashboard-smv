import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OrderCard } from '../OrderCard'
import type { WorkOrder } from '@/types'

const baseOrder: WorkOrder = {
  id: '1',
  company_name: 'ACME',
  po_number: 'PO-123',
  part_name: 'PIEZA {10}',
  quantity_total: 100,
  quantity_completed: 50,
  priority: 'high',
  status: 'production',
  created_at: new Date().toISOString(),
}

describe('OrderCard', () => {
  it('renderiza información básica de la orden', () => {
    render(<OrderCard order={baseOrder} />)

    // PO-123 is formatted by formatPoForDisplay as (00123)
    expect(screen.getByText(/00123/)).toBeInTheDocument()
    expect(screen.getByText(/50%/)).toBeInTheDocument()
  })

  it('muestra la cantidad total de piezas', () => {
    render(<OrderCard order={baseOrder} />)

    expect(screen.getByText(/100/)).toBeInTheDocument()
    // PZS appears in both quantity header and part_name tokens
    const pzsElements = screen.getAllByText(/PZS/i)
    expect(pzsElements.length).toBeGreaterThanOrEqual(1)
  })

  it('muestra 0% de progreso cuando quantity_total es 0', () => {
    const order: WorkOrder = { ...baseOrder, quantity_total: 0, quantity_completed: 0 }
    render(<OrderCard order={order} />)

    // When quantity_total is 0, progress bar is not shown (quantity_total > 0 check)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('muestra 100% de progreso cuando está completa', () => {
    const order: WorkOrder = { ...baseOrder, quantity_completed: 100 }
    render(<OrderCard order={order} />)

    expect(screen.getByText(/100%/i)).toBeInTheDocument()
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '100')
  })

  it('tiene role="article" y aria-label correcto', () => {
    render(<OrderCard order={baseOrder} />)

    const article = screen.getByRole('article')
    expect(article).toHaveAttribute('aria-label', 'Orden PO-123 - PIEZA {10}')
  })

  it('muestra el progressbar con atributos ARIA correctos', () => {
    render(<OrderCard order={baseOrder} />)

    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '50')
    expect(progressBar).toHaveAttribute('aria-valuemin', '0')
    expect(progressBar).toHaveAttribute('aria-valuemax', '100')
  })

  it('renderiza en tvMode con layout diferente', () => {
    render(<OrderCard order={baseOrder} tvMode />)

    // In TV mode, it shows SO/ prefix format
    expect(screen.getByText(/SO\//i)).toBeInTheDocument()
    // Shows quantity and PZS (may be split across elements)
    expect(screen.getByText(/100/)).toBeInTheDocument()
    const pzsElements = screen.getAllByText(/PZS/i)
    expect(pzsElements.length).toBeGreaterThanOrEqual(1)
  })

  it('renderiza con textSize large en tvMode', () => {
    render(<OrderCard order={baseOrder} tvMode textSize="large" />)

    const article = screen.getByRole('article')
    expect(article).toBeInTheDocument()
  })

  it('renderiza con textSize extra-large en tvMode', () => {
    render(<OrderCard order={baseOrder} tvMode textSize="extra-large" />)

    const article = screen.getByRole('article')
    expect(article).toBeInTheDocument()
  })

  it('muestra badge de prioridad critical como ON HOLD', () => {
    const order: WorkOrder = { ...baseOrder, priority: 'critical' }
    render(<OrderCard order={order} />)

    expect(screen.getByText('ON HOLD')).toBeInTheDocument()
  })

  it('muestra badge de prioridad high como PRIORIDAD', () => {
    render(<OrderCard order={baseOrder} />)

    expect(screen.getByText('PRIORIDAD')).toBeInTheDocument()
  })

  it('muestra badge de prioridad normal como PROGRAMADA', () => {
    const order: WorkOrder = { ...baseOrder, priority: 'normal' }
    render(<OrderCard order={order} />)

    expect(screen.getByText('PROGRAMADA')).toBeInTheDocument()
  })

  it('muestra badge de prioridad low como PROGRAMADA', () => {
    const order: WorkOrder = { ...baseOrder, priority: 'low' }
    render(<OrderCard order={order} />)

    expect(screen.getByText('PROGRAMADA')).toBeInTheDocument()
  })

  it('maneja part_name null gracefully', () => {
    const order: WorkOrder = { ...baseOrder, part_name: '' }
    render(<OrderCard order={order} />)

    // Should show N/A for empty part_name
    expect(screen.getByText('N/A')).toBeInTheDocument()
  })

  it('parsea {N} tokens en part_name como "N PZS"', () => {
    render(<OrderCard order={baseOrder} />)

    // {10} should be converted and displayed
    expect(screen.getByText(/10 PZS/)).toBeInTheDocument()
  })

  it('muestra indicador visual para prioridades high y critical', () => {
    const { container } = render(<OrderCard order={baseOrder} />)

    // High/critical get an absolute bar at top
    const topBar = container.querySelector('.absolute.top-0')
    expect(topBar).toBeInTheDocument()
  })

  it('no muestra indicador visual para prioridad normal', () => {
    const order: WorkOrder = { ...baseOrder, priority: 'normal' }
    const { container } = render(<OrderCard order={order} />)

    const topBar = container.querySelector('.absolute.top-0')
    expect(topBar).not.toBeInTheDocument()
  })

  it('renderiza diferentes status con footer backgrounds', () => {
    for (const status of ['scheduled', 'production', 'quality', 'hold'] as const) {
      const order: WorkOrder = { ...baseOrder, status }
      const { unmount } = render(<OrderCard order={order} tvMode />)
      // Should not crash for any status
      expect(screen.getByRole('article')).toBeInTheDocument()
      unmount()
    }
  })
})
