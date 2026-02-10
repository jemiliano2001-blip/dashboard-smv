import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrderForm } from '../OrderForm'
import type { WorkOrderFormData } from '../../types'

vi.mock('../../hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcut: vi.fn(),
}))

describe('OrderForm', () => {
  const onSave = vi.fn()
  const onCancel = vi.fn()

  beforeEach(() => {
    onSave.mockClear()
    onCancel.mockClear()
    localStorage.clear()
  })

  it('renders create form when order is null', () => {
    render(
      <OrderForm order={null} onSave={onSave} onCancel={onCancel} />
    )

    expect(screen.getByRole('heading', { name: /nueva orden/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/nombre de compañía/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument()
  })

  it('shows validation errors on submit when required fields are empty', async () => {
    const user = userEvent.setup()
    render(
      <OrderForm order={null} onSave={onSave} onCancel={onCancel} />
    )

    const submitButton = screen.getByRole('button', { name: /guardar/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/el nombre de la compañía es requerido/i)).toBeInTheDocument()
    })

    expect(onSave).not.toHaveBeenCalled()
  })

  it('calls onSave with form data when all required fields are valid', async () => {
    const user = userEvent.setup()
    render(
      <OrderForm order={null} onSave={onSave} onCancel={onCancel} />
    )

    await user.type(screen.getByLabelText(/nombre de compañía/i), 'Acme')
    await user.type(screen.getByLabelText(/número de PO|po/i), 'PO-001')
    await user.type(screen.getByLabelText(/nombre de la pieza|pieza/i), 'Widget')
    const dateInput = screen.getByLabelText(/fecha de creación/i)
    await user.clear(dateInput)
    await user.type(dateInput, '2024-01-15')
    await user.type(screen.getByLabelText(/cantidad total/i), '100')
    await user.type(screen.getByLabelText(/cantidad completada/i), '0')

    const submitButton = screen.getByRole('button', { name: /guardar/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1)
    })

    const savedData = onSave.mock.calls[0]?.[0] as WorkOrderFormData | undefined
    expect(savedData).toBeDefined()
    expect(savedData!.company_name).toBe('Acme')
    expect(savedData!.po_number).toBe('PO-001')
    expect(savedData!.part_name).toBe('Widget')
    expect(savedData!.quantity_total).toBe(100)
    expect(savedData!.quantity_completed).toBe(0)
    expect(savedData!.created_at).toBe('2024-01-15')
  })

  it('renders edit form when order is provided', () => {
    const order = {
      id: '1',
      company_name: 'Acme',
      po_number: 'PO-001',
      part_name: 'Widget',
      quantity_total: 100,
      quantity_completed: 50,
      priority: 'normal' as const,
      status: 'production' as const,
      created_at: '2024-01-01T00:00:00Z',
    }
    render(
      <OrderForm order={order} onSave={onSave} onCancel={onCancel} />
    )

    expect(screen.getByRole('heading', { name: /editar orden/i })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Acme')).toBeInTheDocument()
    expect(screen.getByDisplayValue('PO-001')).toBeInTheDocument()
  })
})
