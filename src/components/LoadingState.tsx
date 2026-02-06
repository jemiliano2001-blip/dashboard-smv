import { Loader2 } from 'lucide-react'

export function LoadingState() {
  return (
    <div className="flex items-center justify-center h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="text-center">
        <Loader2 className="w-16 h-16 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-xl font-bold text-zinc-600 dark:text-zinc-400">Cargando órdenes de trabajo...</p>
      </div>
    </div>
  )
}
