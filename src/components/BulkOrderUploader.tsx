import { useState, useCallback, useRef, useEffect } from 'react'
import { FileSpreadsheet, Upload, Loader2 } from 'lucide-react'
import { parseBulkUploadFile } from '../utils/bulkUploadParser'
import { insertWorkOrdersBulk } from '@/features/orders/api/workOrders'
import { orderKeyByPo } from '../utils/formatUtils'
import type { WorkOrderCreateInput } from '../types'

const ACCEPT = '.xlsx,.xls,.csv'

export interface BulkOrderUploaderProps {
  onSuccess?: () => void
  existingOrderKeys?: Set<string>
  defaultCompanyName?: string
}

export function BulkOrderUploader({
  onSuccess,
  existingOrderKeys = new Set(),
  defaultCompanyName = 'Importación',
}: BulkOrderUploaderProps) {
  const [companyName, setCompanyName] = useState(defaultCompanyName)
  const [rows, setRows] = useState<WorkOrderCreateInput[]>([])
  const [parseErrors, setParseErrors] = useState<Array<{ row: number; message: string }>>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [successCount, setSuccessCount] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetState = useCallback(() => {
    setSelectedFile(null)
    setRows([])
    setParseErrors([])
    setFileName(null)
    setSuccessCount(null)
    setErrorMessage(null)
  }, [])

  const parseFile = useCallback(async (file: File, company: string) => {
    const result = await parseBulkUploadFile(file, { companyName: company })
    setRows(result.rows)
    setParseErrors(result.errors)
  }, [])

  useEffect(() => {
    if (selectedFile) {
      parseFile(selectedFile, companyName).catch(() => {})
    }
  }, [companyName, selectedFile, parseFile])

  const handleFile = useCallback(
    async (file: File | null) => {
      if (!file) {
        resetState()
        return
      }
      setErrorMessage(null)
      setSuccessCount(null)
      const ext = (file.name || '').toLowerCase()
      if (!ext.endsWith('.xlsx') && !ext.endsWith('.xls') && !ext.endsWith('.csv')) {
        setErrorMessage('Formato no soportado. Use .xlsx, .xls o .csv')
        return
      }
      setSelectedFile(file)
      setFileName(file.name)
      try {
        await parseFile(file, companyName)
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Error al leer el archivo')
        setRows([])
        setParseErrors([])
        setSelectedFile(null)
        setFileName(null)
      }
    },
    [companyName, parseFile, resetState]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const onFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      handleFile(file ?? null)
      e.target.value = ''
    },
    [handleFile]
  )

  const newRows = rows.filter(
    (r) => !existingOrderKeys.has(orderKeyByPo(r.company_name, r.po_number))
  )
  const skippedCount = rows.length - newRows.length

  const handleSubmit = useCallback(async () => {
    if (newRows.length === 0) return
    setUploading(true)
    setErrorMessage(null)
    setSuccessCount(null)
    try {
      const result = await insertWorkOrdersBulk(newRows)
      setSuccessCount(result.inserted)
      if (result.errors.length) {
        setErrorMessage(result.errors.join('; '))
      }
      if (result.inserted > 0 && onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al subir órdenes')
      setSuccessCount(null)
    } finally {
      setUploading(false)
    }
  }, [newRows, onSuccess])

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
          Compañía por defecto (solo si el archivo no trae columna compañía o la celda está vacía)
        </label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Importación"
          className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
      </div>

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800'}
        `}
      >
        <FileSpreadsheet className="w-12 h-12 text-zinc-500 dark:text-zinc-400 mx-auto mb-3" />
        <p className="text-zinc-700 dark:text-zinc-300 mb-2">
          Arrastra aquí un Excel o CSV, o haz clic para seleccionar
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          onChange={onFileInputChange}
          className="hidden"
          aria-label="Seleccionar archivo"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl border border-zinc-200 dark:border-zinc-600 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Seleccionar archivo
        </button>
      </div>

      {errorMessage && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm">
          {errorMessage}
        </div>
      )}

      {parseErrors.length > 0 && (
        <div className="px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-300 text-sm">
          <p className="font-medium mb-1">Advertencias de validación:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {parseErrors.slice(0, 10).map((e, i) => (
              <li key={i}>
                Fila {e.row}: {e.message}
              </li>
            ))}
            {parseErrors.length > 10 && (
              <li>… y {parseErrors.length - 10} más</li>
            )}
          </ul>
        </div>
      )}

      {fileName && rows.length > 0 && (
        <>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            <strong className="text-zinc-900 dark:text-zinc-100">{fileName}</strong> — {rows.length} fila(s) leída(s).
            {newRows.length > 0 && (
              <span className="block mt-1 text-zinc-700 dark:text-zinc-300">
                Vista previa: <strong>{newRows.length}</strong> orden(es) a agregar.
              </span>
            )}
            {skippedCount > 0 && (
              <span className="block mt-1 text-amber-600 dark:text-amber-400">
                {skippedCount} línea(s) omitida(s) (orden + parte ya existen).
              </span>
            )}
          </p>

          {newRows.length > 0 && (
            <div className="max-h-[60vh] overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-900">
                    <tr className="text-left">
                      <th className="px-4 py-2 text-zinc-600 dark:text-zinc-400 font-medium">Compañía</th>
                      <th className="px-4 py-2 text-zinc-600 dark:text-zinc-400 font-medium">Orden / PO</th>
                      <th className="px-4 py-2 text-zinc-600 dark:text-zinc-400 font-medium">Número de parte</th>
                      <th className="px-4 py-2 text-zinc-600 dark:text-zinc-400 font-medium">Cantidad</th>
                      <th className="px-4 py-2 text-zinc-600 dark:text-zinc-400 font-medium">Fecha</th>
                      <th className="px-4 py-2 text-zinc-600 dark:text-zinc-400 font-medium">Estatus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newRows.map((r, i) => (
                      <tr key={i} className="border-t border-zinc-200 dark:border-zinc-700">
                        <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">{r.company_name}</td>
                        <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">{r.po_number}</td>
                        <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">{r.part_name}</td>
                        <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">{r.quantity_total}</td>
                        <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                          {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">{r.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {newRows.length > 0 && (
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={uploading}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Subiendo…
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Subir {newRows.length} orden(es)
                  </>
                )}
              </button>
            </div>
          )}

          {successCount !== null && successCount > 0 && (
            <p className="text-green-600 dark:text-green-400 font-medium">
              Éxito: {successCount} orden(es) agregada(s).
            </p>
          )}
        </>
      )}
    </div>
  )
}
