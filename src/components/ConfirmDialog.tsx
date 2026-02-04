import { Modal } from './Modal'
import { AlertTriangle } from 'lucide-react'

type ConfirmVariant = 'danger' | 'warning' | 'info'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
}

/**
 * Confirmation dialog component
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar acción',
  message = '¿Estás seguro de que deseas realizar esta acción?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
}: ConfirmDialogProps) {
  const variantClasses: Record<ConfirmVariant, string> = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    info: 'bg-blue-600 hover:bg-blue-700',
  }

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <AlertTriangle
            className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
              variant === 'danger' ? 'text-red-500' : variant === 'warning' ? 'text-yellow-500' : 'text-blue-500'
            }`}
          />
          <p className="text-gray-300 flex-1">{message}</p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-white font-bold rounded-lg transition-colors ${variantClasses[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
