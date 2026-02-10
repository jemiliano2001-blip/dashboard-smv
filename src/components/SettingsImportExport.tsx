import { useState, type ChangeEvent } from 'react'
import { Download, Upload, AlertTriangle, CheckCircle } from 'lucide-react'
import { SettingsSection } from './SettingsSection'
import { Modal } from './Modal'
import type { AppSettings } from '../types'
import { DEFAULT_APP_SETTINGS } from '../types/settings'
import { logger } from '../utils/logger'

interface SettingsImportExportProps {
  currentSettings: AppSettings
  onImport: (settings: AppSettings) => void
}

export function SettingsImportExport({ currentSettings, onImport }: SettingsImportExportProps) {
  const [showImportModal, setShowImportModal] = useState(false)
  const [importPreview, setImportPreview] = useState<Partial<AppSettings> | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [backupCreated, setBackupCreated] = useState(false)

  const handleExport = () => {
    const exportData = {
      ...currentSettings,
      lastModified: new Date().toISOString(),
      version: '1.0',
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tv-dashboard-settings-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const createBackup = () => {
    const backup = {
      ...currentSettings,
      backupCreatedAt: new Date().toISOString(),
    }
    localStorage.setItem('settings-backup', JSON.stringify(backup))
    setBackupCreated(true)
    setTimeout(() => setBackupCreated(false), 3000)
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const parsed = JSON.parse(content) as Partial<AppSettings>

        if (!parsed.dashboard && !parsed.adminPanel && !parsed.appearance) {
          throw new Error('El archivo no contiene configuraciones válidas')
        }

        setImportPreview(parsed)
        setImportError(null)
        createBackup()
      } catch (error) {
        setImportError(error instanceof Error ? error.message : 'Error al leer el archivo')
        setImportPreview(null)
        logger.error('Error importing settings', error as Error, {
          feature: 'settings',
          action: 'import',
        })
      }
    }

    reader.readAsText(file)
    e.target.value = ''
  }

  const handleConfirmImport = () => {
    if (importPreview) {
      const merged: AppSettings = {
        dashboard: { ...DEFAULT_APP_SETTINGS.dashboard, ...importPreview.dashboard },
        adminPanel: { ...DEFAULT_APP_SETTINGS.adminPanel, ...importPreview.adminPanel },
        appearance: { ...DEFAULT_APP_SETTINGS.appearance, ...importPreview.appearance },
      }
      onImport(merged)
      setShowImportModal(false)
      setImportPreview(null)
      setImportError(null)
    }
  }

  const handleCancelImport = () => {
    setShowImportModal(false)
    setImportPreview(null)
    setImportError(null)
  }

  return (
    <>
      <SettingsSection
        title="Exportar Configuración"
        description="Descarga todas tus configuraciones como archivo JSON"
        storageKey="settings-export"
        icon={<Download className="w-5 h-5" />}
      >
        <div className="space-y-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Exporta todas tus configuraciones actuales a un archivo JSON que puedes guardar o compartir.
          </p>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar Configuración
          </button>
          {backupCreated && (
            <div className="flex items-center gap-2 p-2 bg-blue-600/20 border border-blue-600/50 rounded-lg text-sm text-blue-300">
              <CheckCircle className="w-4 h-4" />
              Backup creado automáticamente
            </div>
          )}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Importar Configuración"
        description="Carga configuraciones desde un archivo JSON"
        storageKey="settings-import"
        icon={<Upload className="w-5 h-5" />}
      >
        <div className="space-y-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Importa configuraciones desde un archivo JSON. Se creará un backup automático antes de importar.
          </p>
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors cursor-pointer inline-block">
            <Upload className="w-4 h-4" />
            Seleccionar Archivo para Importar
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              onClick={() => setShowImportModal(true)}
              className="hidden"
            />
          </label>
        </div>
      </SettingsSection>

      <Modal
        isOpen={showImportModal}
        onClose={handleCancelImport}
        title="Importar Configuración"
        size="lg"
      >
        <div className="space-y-4">
          {importError && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-500 mb-1">Error al Importar</p>
                <p className="text-xs text-red-400">{importError}</p>
              </div>
            </div>
          )}

          {importPreview && !importError && (
            <>
              <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-green-500 mb-1">Archivo Válido</p>
                  <p className="text-xs text-green-400">
                    El archivo se ha cargado correctamente. Revisa las configuraciones que se aplicarán:
                  </p>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
                <pre className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-mono">
                  {JSON.stringify(importPreview, null, 2)}
                </pre>
              </div>

              <div className="bg-blue-600/10 border border-blue-500/50 rounded-lg p-3">
                <p className="text-xs text-blue-300">
                  <strong>Nota:</strong> Solo se importarán las configuraciones presentes en el archivo. 
                  Las configuraciones no incluidas mantendrán sus valores actuales.
                </p>
              </div>
            </>
          )}

          {!importPreview && !importError && (
            <div className="text-center py-8">
              <Upload className="w-12 h-12 text-zinc-500 dark:text-zinc-400 mx-auto mb-4" />
              <p className="text-zinc-600 dark:text-zinc-400 mb-2">Selecciona un archivo JSON</p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                Seleccionar Archivo
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <button
              onClick={handleCancelImport}
              className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 font-bold rounded-lg transition-colors"
            >
              Cancelar
            </button>
            {importPreview && !importError && (
              <button
                onClick={handleConfirmImport}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
              >
                Confirmar Importación
              </button>
            )}
          </div>
        </div>
      </Modal>
    </>
  )
}
