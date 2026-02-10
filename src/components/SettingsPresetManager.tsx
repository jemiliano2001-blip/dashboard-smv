import { useState, useEffect, type ChangeEvent } from 'react'
import { Save, Trash2, Copy, Download } from 'lucide-react'
import { Modal } from './Modal'
import { ConfirmDialog } from './ConfirmDialog'
import type { SettingsPreset, AppSettings } from '../types'

const PRESETS_STORAGE_KEY = 'settings-presets'

interface SettingsPresetManagerProps {
  currentSettings: AppSettings
  onLoadPreset: (preset: SettingsPreset) => void
}

export function SettingsPresetManager({ currentSettings, onLoadPreset }: SettingsPresetManagerProps) {
  const [presets, setPresets] = useState<SettingsPreset[]>([])
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [presetDescription, setPresetDescription] = useState('')
  const [confirmDeletePreset, setConfirmDeletePreset] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(PRESETS_STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SettingsPreset[]
        setPresets(parsed)
      } catch {
        setPresets([])
      }
    } else {
      // Load default presets
      const defaultPresets: SettingsPreset[] = [
        {
          id: 'production-high',
          name: 'Producción Alta',
          description: 'Alta capacidad, auto-scroll rápido',
          isDefault: true,
          createdAt: new Date().toISOString(),
          settings: {
            dashboard: {
              ...currentSettings.dashboard,
              ordersPerPage: 100,
              autoScrollInterval: 10,
              companyRotation: 20,
              pageRotation: 10,
            },
          },
        },
        {
          id: 'presentation',
          name: 'Presentación',
          description: 'Rotaciones lentas, diseño espacioso',
          isDefault: true,
          createdAt: new Date().toISOString(),
          settings: {
            dashboard: {
              ...currentSettings.dashboard,
              ordersPerPage: 8,
              autoScrollInterval: 30,
              companyRotation: 60,
              pageRotation: 20,
              autoScrollEnabled: true,
            },
            appearance: {
              ...currentSettings.appearance,
              density: 'spacious',
            },
          },
        },
        {
          id: 'monitoring',
          name: 'Monitoreo',
          description: 'Actualizaciones frecuentes',
          isDefault: true,
          createdAt: new Date().toISOString(),
          settings: {
            dashboard: {
              ...currentSettings.dashboard,
              autoScrollInterval: 15,
            },
            adminPanel: {
              ...currentSettings.adminPanel,
              autoRefreshInterval: 2000,
            },
          },
        },
      ]
      setPresets(defaultPresets)
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(defaultPresets))
    }
  }, [currentSettings])

  const handleSavePreset = () => {
    if (!presetName.trim()) return

    const newPreset: SettingsPreset = {
      id: `preset-${Date.now()}`,
      name: presetName.trim(),
      description: presetDescription.trim() || undefined,
      settings: currentSettings,
      createdAt: new Date().toISOString(),
    }

    const updated = [...presets, newPreset]
    setPresets(updated)
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated))
    setShowSaveModal(false)
    setPresetName('')
    setPresetDescription('')
  }

  const handleDeletePreset = (id: string) => {
    setConfirmDeletePreset(id)
  }

  const handleConfirmDeletePreset = () => {
    if (!confirmDeletePreset) return
    const updated = presets.filter((p) => p.id !== confirmDeletePreset)
    setPresets(updated)
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated))
    setConfirmDeletePreset(null)
  }

  const handleDuplicatePreset = (preset: SettingsPreset) => {
    const duplicated: SettingsPreset = {
      ...preset,
      id: `preset-${Date.now()}`,
      name: `${preset.name} (Copia)`,
      createdAt: new Date().toISOString(),
      isDefault: false,
    }
    const updated = [...presets, duplicated]
    setPresets(updated)
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated))
  }

  const handleExportPreset = (preset: SettingsPreset) => {
    const dataStr = JSON.stringify(preset, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `preset-${preset.name.toLowerCase().replace(/\s+/g, '-')}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Presets Guardados</h3>
        <button
          onClick={() => setShowSaveModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors text-sm"
        >
          <Save className="w-4 h-4" />
          Guardar Preset Actual
        </button>
      </div>

      <div className="space-y-2">
        {presets.map((preset) => (
          <div
            key={preset.id}
            className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100">{preset.name}</h4>
                {preset.isDefault && (
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded">
                    Predefinido
                  </span>
                )}
              </div>
              {preset.description && (
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">{preset.description}</p>
              )}
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Creado: {new Date(preset.createdAt).toLocaleDateString('es-ES')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onLoadPreset(preset)}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded transition-colors"
              >
                Cargar
              </button>
              {!preset.isDefault && (
                <>
                  <button
                    onClick={() => handleDuplicatePreset(preset)}
                    className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded transition-colors"
                    title="Duplicar preset"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePreset(preset.id)}
                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
                    title="Eliminar preset"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
              <button
                onClick={() => handleExportPreset(preset)}
                className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                title="Exportar preset"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {presets.length === 0 && (
          <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
            <p>No hay presets guardados</p>
            <p className="text-sm mt-2">Crea un preset para guardar tu configuración actual</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showSaveModal}
        onClose={() => {
          setShowSaveModal(false)
          setPresetName('')
          setPresetDescription('')
        }}
        title="Guardar Preset"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-2">
              Nombre del Preset *
            </label>
            <input
              type="text"
              value={presetName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPresetName(e.target.value)}
              placeholder="Ej: Mi Configuración"
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-2">
              Descripción (opcional)
            </label>
            <textarea
              value={presetDescription}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPresetDescription(e.target.value)}
              placeholder="Descripción del preset..."
              rows={3}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowSaveModal(false)
                setPresetName('')
                setPresetDescription('')
              }}
              className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 font-bold rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSavePreset}
              disabled={!presetName.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDeletePreset !== null}
        onClose={() => setConfirmDeletePreset(null)}
        onConfirm={handleConfirmDeletePreset}
        title="Eliminar Preset"
        message="¿Estás seguro de que deseas eliminar este preset?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </>
  )
}
