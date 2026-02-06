import { useState, useEffect, ReactNode } from 'react'
import { ChevronDown, ChevronRight, AlertCircle } from 'lucide-react'

interface SettingsSectionProps {
  title: string
  description?: string
  children: ReactNode
  defaultExpanded?: boolean
  storageKey?: string
  hasChanges?: boolean
  warning?: string
  icon?: ReactNode
}

const STORAGE_KEY_PREFIX = 'settings-section-'

export function SettingsSection({
  title,
  description,
  children,
  defaultExpanded = true,
  storageKey,
  hasChanges = false,
  warning,
  icon,
}: SettingsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${storageKey}`)
      if (saved !== null) {
        return saved === 'true'
      }
    }
    return defaultExpanded
  })

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${storageKey}`, String(isExpanded))
    }
  }, [isExpanded, storageKey])

  return (
    <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-left"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3 flex-1">
          {icon && <div className="text-blue-600 dark:text-blue-400">{icon}</div>}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
              {hasChanges && (
                <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                  Cambios sin guardar
                </span>
              )}
              {warning && (
                <AlertCircle className="w-4 h-4 text-yellow-500" title={warning} />
              )}
            </div>
            {description && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{description}</p>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
        )}
      </button>
      
      {isExpanded && (
        <div 
          id={`settings-section-${title.toLowerCase().replace(/\s+/g, '-')}`}
          className="px-4 pb-4 pt-2 space-y-4"
          role="region"
          aria-labelledby={`settings-section-title-${title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {children}
        </div>
      )}
    </div>
  )
}
