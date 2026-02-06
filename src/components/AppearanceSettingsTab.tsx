import { ChangeEvent } from 'react'
import { SettingsSection } from './SettingsSection'
import { Type, Eye, Zap, ZapOff } from 'lucide-react'
import type { AppearanceSettings, Density, FontSize, Contrast } from '../types'

interface AppearanceSettingsTabProps {
  settings: AppearanceSettings
  onChange: (settings: AppearanceSettings) => void
  hasChanges?: boolean
}

const DENSITY_OPTIONS: Array<{ value: Density; label: string; description: string }> = [
  { value: 'compact', label: 'Compacto', description: 'Más información en menos espacio' },
  { value: 'comfortable', label: 'Cómodo', description: 'Balance entre espacio y contenido' },
  { value: 'spacious', label: 'Espacioso', description: 'Más espacio entre elementos' },
]

const FONT_SIZE_OPTIONS: Array<{ value: FontSize; label: string }> = [
  { value: 'small', label: 'Pequeño' },
  { value: 'medium', label: 'Mediano' },
  { value: 'large', label: 'Grande' },
]

const CONTRAST_OPTIONS: Array<{ value: Contrast; label: string; description: string }> = [
  { value: 'normal', label: 'Normal', description: 'Contraste estándar' },
  { value: 'high', label: 'Alto', description: 'Mayor contraste para mejor legibilidad' },
]

export function AppearanceSettingsTab({ 
  settings, 
  onChange, 
  hasChanges = false 
}: AppearanceSettingsTabProps) {
  const handleChange = (key: keyof AppearanceSettings, value: unknown) => {
    onChange({ ...settings, [key]: value })
  }

  return (
    <div className="space-y-4">
      <SettingsSection
        title="Densidad de Información"
        description="Ajusta el espaciado entre elementos"
        storageKey="appearance-density"
        hasChanges={hasChanges}
        icon={<Type className="w-5 h-5" />}
      >
        <div className="space-y-2">
          {DENSITY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                settings.density === option.value
                  ? 'bg-blue-600/20 border-2 border-blue-600'
                  : 'bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <input
                type="radio"
                name="density"
                value={option.value}
                checked={settings.density === option.value}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleChange('density', e.target.value as Density)
                }
                className="mt-1 w-4 h-4 text-blue-600 bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{option.label}</div>
                  {settings.density === option.value && (
                    <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                      Activo
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{option.description}</div>
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-2 rounded ${
                        option.value === 'compact'
                          ? 'w-8 bg-blue-400'
                          : option.value === 'comfortable'
                          ? 'w-6 bg-blue-400'
                          : 'w-4 bg-blue-400'
                      }`}
                      style={{
                        marginRight: option.value === 'compact' ? '2px' : option.value === 'comfortable' ? '4px' : '6px',
                      }}
                    />
                  ))}
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">
                    {option.value === 'compact' && 'Espaciado mínimo'}
                    {option.value === 'comfortable' && 'Espaciado medio'}
                    {option.value === 'spacious' && 'Espaciado amplio'}
                  </span>
                </div>
              </div>
            </label>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Tamaño de Fuente"
        description="Ajusta el tamaño de la tipografía"
        storageKey="appearance-fontsize"
        hasChanges={hasChanges}
        icon={<Type className="w-5 h-5" />}
      >
        <div>
          <label className="block text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-2">
            Tamaño de Fuente
          </label>
          <select
            value={settings.fontSize}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              handleChange('fontSize', e.target.value as FontSize)
            }
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {FONT_SIZE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="mt-3 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Vista previa:</p>
            <div
              className={`text-zinc-900 dark:text-zinc-100 ${
                settings.fontSize === 'small'
                  ? 'text-xs'
                  : settings.fontSize === 'medium'
                  ? 'text-sm'
                  : 'text-base'
              }`}
            >
              <p className="font-bold">Texto en negrita</p>
              <p className="mt-1">Texto normal de ejemplo para ver el tamaño de fuente seleccionado.</p>
            </div>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            Esto afecta el tamaño del texto en toda la aplicación. Pequeño = más contenido visible, Grande = mejor legibilidad.
          </p>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Contraste"
        description="Ajusta el contraste de colores para mejor legibilidad"
        storageKey="appearance-contrast"
        hasChanges={hasChanges}
        icon={<Eye className="w-5 h-5" />}
      >
        <div className="space-y-2">
          {CONTRAST_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                settings.contrast === option.value
                  ? 'bg-blue-600/20 border-2 border-blue-600'
                  : 'bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <input
                type="radio"
                name="contrast"
                value={option.value}
                checked={settings.contrast === option.value}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleChange('contrast', e.target.value as Contrast)
                }
                className="mt-1 w-4 h-4 text-blue-600 bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{option.label}</div>
                  {settings.contrast === option.value && (
                    <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                      Activo
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{option.description}</div>
                <div className="mt-2 flex items-center gap-2">
                  <div
                    className={`px-3 py-1.5 rounded ${
                      option.value === 'normal'
                        ? 'bg-zinc-200 dark:bg-zinc-600 text-zinc-700 dark:text-zinc-300'
                        : 'bg-zinc-800 text-zinc-100 border-2 border-zinc-200 dark:border-zinc-600'
                    }`}
                  >
                    <span className="text-xs font-bold">Ejemplo</span>
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {option.value === 'normal' && 'Contraste estándar para uso general'}
                    {option.value === 'high' && 'Alto contraste recomendado para accesibilidad'}
                  </span>
                </div>
              </div>
            </label>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Animaciones"
        description="Habilitar o deshabilitar transiciones y animaciones"
        storageKey="appearance-animations"
        hasChanges={hasChanges}
        icon={settings.animationsEnabled ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label className="block text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-1">
              Habilitar Animaciones
            </label>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Activa transiciones suaves y efectos de animación en toda la aplicación
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.animationsEnabled}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange('animationsEnabled', e.target.checked)
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-200 dark:bg-zinc-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </SettingsSection>
    </div>
  )
}
