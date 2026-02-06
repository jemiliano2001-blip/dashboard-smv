import { useState, useEffect, useRef, FormEvent, ChangeEvent, useMemo } from 'react'
import { Save, X, Trash2, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react'
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcuts'
import { ConfirmDialog } from './ConfirmDialog'
import { VALIDATION_MESSAGES, INPUT_LIMITS } from '../utils/constants'
import { isoToLocalDateString, localDateStringToISO } from '../utils/dateFormatter'
import { debounce } from '../utils/debounce'
import type { WorkOrder, WorkOrderFormData, Priority, Status } from '../types'

const DRAFT_STORAGE_KEY = 'order-form-draft'
const AUTO_SAVE_DELAY = 1000

const PRIORITY_OPTIONS: Array<{ value: Priority; label: string }> = [
  { value: 'low', label: 'Baja' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Crítica' },
]

const STATUS_OPTIONS: Array<{ value: Status; label: string }> = [
  { value: 'scheduled', label: 'Programada' },
  { value: 'production', label: 'En Producción' },
  { value: 'quality', label: 'Calidad' },
  { value: 'hold', label: 'En Hold' },
]

interface OrderFormProps {
  order: WorkOrder | null
  onSave: (formData: WorkOrderFormData) => void | Promise<void>
  onCancel: () => void
  onDelete?: (id: string) => void | Promise<void>
  loading?: boolean
}

interface ValidationErrors {
  company_name?: string
  po_number?: string
  part_name?: string
  quantity_total?: string
  quantity_completed?: string
  created_at?: string
}

interface ValidationWarnings {
  quantity_completed?: string
}

export function OrderForm({ order, onSave, onCancel, onDelete, loading = false }: OrderFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [formData, setFormData] = useState<WorkOrderFormData>({
    company_name: '',
    po_number: '',
    part_name: '',
    quantity_total: 0,
    quantity_completed: 0,
    priority: 'normal',
    status: 'scheduled',
    created_at: '',
  })
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())
  const [isDirty, setIsDirty] = useState(false)
  const [confirmClearDraft, setConfirmClearDraft] = useState(false)

  const isEditMode = !!order

  const validateField = (name: string, value: string | number): string | undefined => {
    switch (name) {
      case 'company_name':
        if (!value || String(value).trim() === '') {
          return VALIDATION_MESSAGES.COMPANY_NAME_REQUIRED
        }
        if (String(value).length > INPUT_LIMITS.COMPANY_NAME_MAX) {
          return `El nombre debe tener máximo ${INPUT_LIMITS.COMPANY_NAME_MAX} caracteres`
        }
        return undefined
      case 'po_number':
        if (!value || String(value).trim() === '') {
          return VALIDATION_MESSAGES.PO_NUMBER_REQUIRED
        }
        if (String(value).length > INPUT_LIMITS.PO_NUMBER_MAX) {
          return `El número de PO debe tener máximo ${INPUT_LIMITS.PO_NUMBER_MAX} caracteres`
        }
        return undefined
      case 'part_name':
        if (!value || String(value).trim() === '') {
          return VALIDATION_MESSAGES.PART_NAME_REQUIRED
        }
        if (String(value).length > INPUT_LIMITS.PART_NAME_MAX) {
          return `El nombre de pieza debe tener máximo ${INPUT_LIMITS.PART_NAME_MAX} caracteres`
        }
        return undefined
      case 'quantity_total':
        if (typeof value === 'number' && value < 0) {
          return VALIDATION_MESSAGES.QUANTITY_TOTAL_INVALID
        }
        return undefined
      case 'quantity_completed':
        if (typeof value === 'number' && value < 0) {
          return VALIDATION_MESSAGES.QUANTITY_COMPLETED_INVALID
        }
        return undefined
      default:
        return undefined
    }
  }

  const validateForm = (data: WorkOrderFormData): ValidationErrors => {
    const errors: ValidationErrors = {}
    
    const companyError = validateField('company_name', data.company_name)
    if (companyError) errors.company_name = companyError

    const poError = validateField('po_number', data.po_number)
    if (poError) errors.po_number = poError

    const partError = validateField('part_name', data.part_name)
    if (partError) errors.part_name = partError

    const totalError = validateField('quantity_total', data.quantity_total)
    if (totalError) errors.quantity_total = totalError

    const completedError = validateField('quantity_completed', data.quantity_completed)
    if (completedError) errors.quantity_completed = completedError

    if (!data.created_at) {
      errors.created_at = 'La fecha de creación es requerida'
    }

    return errors
  }

  const errors = useMemo(() => validateForm(formData), [formData])

  const validationWarnings = useMemo((): ValidationWarnings => {
    const w: ValidationWarnings = {}
    if (formData.quantity_completed > formData.quantity_total) {
      w.quantity_completed = VALIDATION_MESSAGES.QUANTITY_EXCEEDS_TOTAL
    }
    return w
  }, [formData.quantity_completed, formData.quantity_total])

  const autoSaveDraft = useMemo(
    () =>
      debounce((data: WorkOrderFormData) => {
        if (!isEditMode && isDirty) {
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data))
        }
      }, AUTO_SAVE_DELAY),
    [isEditMode, isDirty]
  )

  useEffect(() => {
    if (isDirty && !isEditMode) {
      autoSaveDraft(formData)
    }
  }, [formData, isDirty, isEditMode, autoSaveDraft])

  useEffect(() => {
    if (!isEditMode) {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft) as WorkOrderFormData
          setFormData(draft)
          setIsDirty(true)
        } catch {
          // Ignore invalid draft
        }
      }
    }
  }, [isEditMode])

  useEffect(() => {
    setValidationErrors(errors)
  }, [errors])

  useKeyboardShortcut('ctrl+s', (e) => {
    e.preventDefault()
    if (!loading && formRef.current) {
      formRef.current.requestSubmit()
    }
  })

  useKeyboardShortcut('cmd+s', (e) => {
    e.preventDefault()
    if (!loading && formRef.current) {
      formRef.current.requestSubmit()
    }
  })

  useEffect(() => {
    const getDefaultDateString = (): string =>
      isoToLocalDateString(new Date().toISOString())

    if (order) {
      setFormData({
        company_name: order.company_name ?? '',
        po_number: order.po_number ?? '',
        part_name: order.part_name ?? '',
        quantity_total: order.quantity_total ?? 0,
        quantity_completed: order.quantity_completed ?? 0,
        priority: (order.priority ?? 'normal') as 'low' | 'normal' | 'high' | 'critical',
        status: (order.status ?? 'scheduled') as 'scheduled' | 'production' | 'quality' | 'hold',
        created_at: order.created_at ? isoToLocalDateString(order.created_at) : getDefaultDateString(),
      })
      setIsDirty(false)
      setTouchedFields(new Set())
    } else {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft) as WorkOrderFormData
          setFormData(draft)
          setIsDirty(true)
        } catch {
          setFormData({
            company_name: '',
            po_number: '',
            part_name: '',
            quantity_total: 0,
            quantity_completed: 0,
            priority: 'normal',
            status: 'scheduled',
            created_at: getDefaultDateString(),
          })
        }
      } else {
        setFormData({
          company_name: '',
          po_number: '',
          part_name: '',
          quantity_total: 0,
          quantity_completed: 0,
          priority: 'normal',
          status: 'scheduled',
          created_at: getDefaultDateString(),
        })
      }
      setIsDirty(false)
      setTouchedFields(new Set())
    }
  }, [order])

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    const newValue = name.includes('quantity') ? parseInt(value) || 0 : value
    
    setFormData((prev) => {
      const updated = { ...prev, [name]: newValue }
      setIsDirty(true)
      return updated
    })

    setTouchedFields((prev) => new Set(prev).add(name))
    
    const error = validateField(name, newValue)
    setValidationErrors((prev) => ({
      ...prev,
      [name]: error,
    }))
  }

  const handleBlur = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target
    setTouchedFields((prev) => new Set(prev).add(name))
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const allErrors = validateForm(formData)
    
    if (Object.keys(allErrors).length === 0) {
      if (!isEditMode) {
        localStorage.removeItem(DRAFT_STORAGE_KEY)
      }
      setIsDirty(false)
      const payload: WorkOrderFormData = {
        ...formData,
        created_at: localDateStringToISO(formData.created_at),
      }
      onSave(payload)
    } else {
      setTouchedFields(new Set(Object.keys(formData)))
      setValidationErrors(allErrors)
    }
  }

  const handleClearDraft = () => {
    setConfirmClearDraft(true)
  }

  const handleConfirmClearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY)
    const defaultDate = isoToLocalDateString(new Date().toISOString())
    setFormData({
      company_name: '',
      po_number: '',
      part_name: '',
      quantity_total: 0,
      quantity_completed: 0,
      priority: 'normal',
      status: 'scheduled',
      created_at: defaultDate,
    })
    setValidationErrors({})
    setTouchedFields(new Set())
    setConfirmClearDraft(false)
    setIsDirty(false)
  }

  const hasErrors = Object.keys(validationErrors).length > 0
  const isFormValid = !hasErrors && formData.company_name && formData.po_number && formData.part_name

  const progress = formData.quantity_total > 0
    ? Math.round((formData.quantity_completed / formData.quantity_total) * 100)
    : 0

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-1">
            {isEditMode ? 'Editar Orden' : 'Nueva Orden'}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {isEditMode ? 'Modifica los detalles de la orden' : 'Completa los campos para crear una nueva orden'}
          </p>
        </div>
        {isEditMode && (
          <button
            onClick={onCancel}
            className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all duration-200"
            title="Cancelar edición"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {!isEditMode && isDirty && (
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-blue-300 font-medium">Borrador guardado automáticamente</span>
          </div>
          <button
            type="button"
            onClick={handleClearDraft}
            className="text-xs text-blue-300 hover:text-blue-200 font-medium underline transition-colors duration-200"
          >
            Limpiar borrador
          </button>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-3">
            Nombre de Compañía *
          </label>
          <div className="relative">
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              className={`w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                touchedFields.has('company_name') && validationErrors.company_name
                  ? 'border-red-500/50 focus:ring-red-500/50'
                  : touchedFields.has('company_name') && !validationErrors.company_name
                  ? 'border-green-500/50 focus:ring-green-500/50'
                  : 'border-zinc-200 dark:border-zinc-600 focus:ring-blue-500/50 focus:border-blue-500'
              }`}
              placeholder="Ej: Acme Corp"
              aria-label="Nombre de compañía"
              aria-required="true"
              aria-invalid={!!validationErrors.company_name}
            />
            {touchedFields.has('company_name') && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {validationErrors.company_name ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
            )}
          </div>
          {touchedFields.has('company_name') && validationErrors.company_name && (
            <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {validationErrors.company_name}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-2">
            Número de PO *
          </label>
          <div className="relative">
            <input
              type="text"
              name="po_number"
              value={formData.po_number}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              className={`w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 ${
                touchedFields.has('po_number') && validationErrors.po_number
                  ? 'border-red-500 focus:ring-red-500'
                  : touchedFields.has('po_number') && !validationErrors.po_number
                  ? 'border-green-500 focus:ring-green-500'
                  : 'border-zinc-200 dark:border-zinc-600 focus:ring-blue-500'
              }`}
              placeholder="Ej: PO-2024-001"
              aria-invalid={!!validationErrors.po_number}
            />
            {touchedFields.has('po_number') && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {validationErrors.po_number ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
            )}
          </div>
          {touchedFields.has('po_number') && validationErrors.po_number && (
            <p className="mt-2 text-xs text-red-400 flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {validationErrors.po_number}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-3">
            Nombre de Pieza *
          </label>
          <div className="relative">
            <input
              type="text"
              name="part_name"
              value={formData.part_name}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              className={`w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                touchedFields.has('part_name') && validationErrors.part_name
                  ? 'border-red-500/50 focus:ring-red-500/50'
                  : touchedFields.has('part_name') && !validationErrors.part_name
                  ? 'border-green-500/50 focus:ring-green-500/50'
                  : 'border-zinc-200 dark:border-zinc-600 focus:ring-blue-500/50 focus:border-blue-500'
              }`}
              placeholder="Ej: Brazo Robótico A-123"
              aria-invalid={!!validationErrors.part_name}
            />
            {touchedFields.has('part_name') && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {validationErrors.part_name ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
            )}
          </div>
          {touchedFields.has('part_name') && validationErrors.part_name && (
            <p className="mt-2 text-xs text-red-400 flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {validationErrors.part_name}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-3">
            Fecha de Creación *
          </label>
          <input
            type="date"
            name="created_at"
            value={formData.created_at}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-3">
              Cantidad Total *
            </label>
            <input
              type="number"
              name="quantity_total"
              value={formData.quantity_total}
              onChange={handleChange}
              min="0"
              required
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-3">
              Cantidad Completada *
            </label>
            <div className="relative">
              <input
                type="number"
                name="quantity_completed"
                value={formData.quantity_completed}
                onChange={handleChange}
                onBlur={handleBlur}
                min="0"
                required
                className={`w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  touchedFields.has('quantity_completed') && validationErrors.quantity_completed
                    ? 'border-red-500/50 focus:ring-red-500/50'
                    : validationWarnings.quantity_completed
                    ? 'border-amber-500/50 focus:ring-amber-500/50'
                    : touchedFields.has('quantity_completed') && !validationErrors.quantity_completed
                    ? 'border-green-500/50 focus:ring-green-500/50'
                    : 'border-zinc-200 dark:border-zinc-600 focus:ring-blue-500/50 focus:border-blue-500'
                }`}
                aria-invalid={!!validationErrors.quantity_completed}
              />
              {touchedFields.has('quantity_completed') && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {validationErrors.quantity_completed ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : validationWarnings.quantity_completed ? (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>
              )}
            </div>
            {touchedFields.has('quantity_completed') && validationErrors.quantity_completed && (
              <p className="mt-2 text-xs text-red-400 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {validationErrors.quantity_completed}
              </p>
            )}
            {validationWarnings.quantity_completed && (
              <p className="mt-2 text-xs text-amber-500 flex items-center gap-1.5 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                {validationWarnings.quantity_completed}
              </p>
            )}
          </div>
        </div>

        {formData.quantity_total > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Progreso</span>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{progress}%</span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-3">
              Prioridad *
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white dark:bg-zinc-800">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-3">
              Estado *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white dark:bg-zinc-800">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-4 pt-6 border-t border-zinc-200 dark:border-zinc-700">
          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/20 disabled:shadow-none"
            aria-label="Guardar orden"
          >
            <Save className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Guardando...' : 'Guardar'}
          </button>

          {isEditMode && (
            <button
              type="button"
              onClick={() => onDelete && order && onDelete(order.id)}
              disabled={loading}
              className="px-6 py-3.5 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-red-600 dark:text-red-400 font-semibold rounded-xl transition-all duration-200 border border-red-500/20 hover:border-red-500/30"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </form>

      <ConfirmDialog
        isOpen={confirmClearDraft}
        onClose={() => setConfirmClearDraft(false)}
        onConfirm={handleConfirmClearDraft}
        title="Limpiar Borrador"
        message="¿Deseas limpiar el borrador guardado?"
        confirmText="Limpiar"
        cancelText="Cancelar"
        variant="warning"
      />
    </div>
  )
}
