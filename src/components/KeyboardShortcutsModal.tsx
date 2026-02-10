import { Keyboard } from 'lucide-react'
import { Modal } from './Modal'

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Shortcut {
  keys: string[]
  description: string
  category: string
}

const shortcuts: Shortcut[] = [
  {
    keys: ['Ctrl', 'K'],
    description: 'Enfocar búsqueda',
    category: 'Navegación',
  },
  {
    keys: ['Cmd', 'K'],
    description: 'Enfocar búsqueda (Mac)',
    category: 'Navegación',
  },
  {
    keys: ['Ctrl', 'N'],
    description: 'Nueva orden',
    category: 'Acciones',
  },
  {
    keys: ['Cmd', 'N'],
    description: 'Nueva orden (Mac)',
    category: 'Acciones',
  },
  {
    keys: ['Ctrl', 'S'],
    description: 'Guardar orden',
    category: 'Acciones',
  },
  {
    keys: ['Cmd', 'S'],
    description: 'Guardar orden (Mac)',
    category: 'Acciones',
  },
  {
    keys: ['Esc'],
    description: 'Cancelar edición / Cerrar modales',
    category: 'Navegación',
  },
]

const categories = ['Navegación', 'Acciones']

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const formatKey = (key: string): string => {
    const keyMap: Record<string, string> = {
      Ctrl: 'Ctrl',
      Cmd: '⌘',
      Alt: 'Alt',
      Shift: 'Shift',
      Esc: 'Esc',
      Enter: 'Enter',
      Space: 'Space',
    }
    return keyMap[key] || key
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Atajos de Teclado" size="md">
      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category}>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3">{category}</h3>
            <div className="space-y-2">
              {shortcuts
                .filter((s) => s.category === category)
                .map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-600"
                  >
                    <span className="text-zinc-700 dark:text-zinc-300">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex}>
                          <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded text-sm font-mono text-zinc-900 dark:text-zinc-100">
                            {formatKey(key)}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="mx-1 text-zinc-500 dark:text-zinc-400">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            <Keyboard className="w-4 h-4 inline mr-2" />
            Los atajos de teclado están disponibles en todas las páginas de la aplicación
          </p>
        </div>
      </div>
    </Modal>
  )
}
