import { FileText, Copy, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { logger } from '../utils/logger'

interface EnvSetupErrorProps {
  missingVariables: string[]
  validationErrors?: string[]
}

export function EnvSetupError({ missingVariables, validationErrors = [] }: EnvSetupErrorProps) {
  const [copied, setCopied] = useState(false)

  const envExample = `# Opción 1: Prefijo VITE_ (recomendado para Vite)
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
# O también puedes usar:
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=tu_clave_anonima_de_supabase

# Opción 2: Prefijo REACT_APP_ (compatible con Create React App)
REACT_APP_SUPABASE_URL=tu_url_de_supabase
REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY=tu_clave_anonima_de_supabase

# Opción 3: Prefijo NEXT_PUBLIC_ (compatible con Next.js / convención)
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=tu_clave_anonima_de_supabase`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(envExample)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      logger.error('Failed to copy environment example to clipboard', error instanceof Error ? error : new Error(String(error)), {
        feature: 'env_setup',
        action: 'copy_to_clipboard',
      })
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-zinc-800 border-2 border-yellow-500 rounded-lg p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-yellow-500/20 rounded-lg">
            <FileText className="w-8 h-8 text-yellow-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-white mb-2">Configuración Requerida</h1>
            <p className="text-zinc-300 dark:text-zinc-400">
              {missingVariables.length > 0 || validationErrors.length > 0
                ? 'Hay problemas con la configuración de variables de entorno para conectar con Supabase.'
                : 'Faltan variables de entorno necesarias para conectar con Supabase.'}
            </p>
          </div>
        </div>

        {missingVariables.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white mb-3">Variables faltantes:</h2>
            <ul className="space-y-2 mb-4">
              {missingVariables.map((variable) => (
                <li key={variable} className="flex items-center gap-2 text-red-400">
                  <span className="font-mono text-sm bg-zinc-700 px-2 py-1 rounded">{variable}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {validationErrors.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white mb-3">Errores de validación:</h2>
            <ul className="space-y-2 mb-4">
              {validationErrors.map((err) => (
                <li key={err} className="flex items-center gap-2 text-amber-400">
                  <span className="text-sm">{err}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-bold text-white mb-3">Pasos para configurar:</h2>
          <ol className="list-decimal list-inside space-y-2 text-zinc-300 mb-4">
            <li>Crea un archivo <code className="bg-zinc-700 px-2 py-1 rounded text-sm">.env</code> en la raíz del proyecto</li>
            <li>Agrega las siguientes variables de entorno:</li>
          </ol>

          <div className="relative">
            <pre className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-sm text-zinc-300 overflow-x-auto">
              <code>{envExample}</code>
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors flex items-center gap-2"
              title="Copiar al portapapeles"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-xs">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="text-xs">Copiar</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
          <h3 className="text-blue-400 font-bold mb-2">¿Dónde obtener estas credenciales?</h3>
          <p className="text-zinc-300 text-sm">
            Ve a tu proyecto en{' '}
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Supabase
            </a>
            , ve a Settings → API y copia:
          </p>
          <ul className="list-disc list-inside text-zinc-300 text-sm mt-2 space-y-1">
            <li><strong>Project URL</strong> para <code className="bg-zinc-700 px-1 rounded">VITE_SUPABASE_URL</code> o <code className="bg-zinc-700 px-1 rounded">REACT_APP_SUPABASE_URL</code></li>
            <li><strong>anon public</strong> key para <code className="bg-zinc-700 px-1 rounded">VITE_SUPABASE_ANON_KEY</code>, <code className="bg-zinc-700 px-1 rounded">VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY</code>, <code className="bg-zinc-700 px-1 rounded">REACT_APP_SUPABASE_ANON_KEY</code> o <code className="bg-zinc-700 px-1 rounded">REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY</code></li>
          </ul>
        </div>

        <div className="mt-6 p-4 bg-zinc-700/50 rounded-lg">
          <p className="text-sm text-zinc-300">
            <strong>Nota:</strong> Después de crear el archivo <code className="bg-zinc-800 px-1 rounded">.env</code>, 
            necesitas reiniciar el servidor de desarrollo para que los cambios surtan efecto.
          </p>
        </div>
      </div>
    </div>
  )
}
