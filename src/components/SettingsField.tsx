import { ReactNode, ChangeEvent } from 'react'
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'

export type ValidationState = 'valid' | 'warning' | 'error' | 'info' | null

interface SettingsFieldProps {
  label: string
  description?: string
  error?: string
  warning?: string
  info?: string
  validationState?: ValidationState
  required?: boolean
  unit?: string
  value?: string | number
  children: ReactNode
}

export function SettingsField({
  label,
  description,
  error,
  warning,
  info,
  validationState,
  required = false,
  unit,
  value,
  children,
}: SettingsFieldProps) {
  const getValidationIcon = () => {
    switch (validationState) {
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />
      default:
        return null
    }
  }

  const getValidationColor = () => {
    switch (validationState) {
      case 'valid':
        return 'border-green-500 focus:ring-green-500'
      case 'warning':
        return 'border-yellow-500 focus:ring-yellow-500'
      case 'error':
        return 'border-red-500 focus:ring-red-500'
      case 'info':
        return 'border-blue-500 focus:ring-blue-500'
      default:
        return 'border-slate-600 focus:ring-blue-500'
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-bold text-gray-300">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        {value !== undefined && (
          <span className="text-sm font-bold text-blue-400">
            {value} {unit && <span className="text-gray-400 font-normal">{unit}</span>}
          </span>
        )}
      </div>
      
      <div className="relative">
        {children}
        {validationState && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {getValidationIcon()}
          </div>
        )}
      </div>

      {description && (
        <p className="text-xs text-gray-400">{description}</p>
      )}

      {error && (
        <div className="flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/50 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {warning && (
        <div className="flex items-start gap-2 p-2 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-400">{warning}</p>
        </div>
      )}

      {info && !error && !warning && (
        <div className="flex items-start gap-2 p-2 bg-blue-500/10 border border-blue-500/50 rounded-lg">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-400">{info}</p>
        </div>
      )}
    </div>
  )
}

interface ValidatedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  validationState?: ValidationState
  className?: string
}

export function ValidatedInput({ validationState, className = '', ...props }: ValidatedInputProps) {
  const getValidationColor = () => {
    switch (validationState) {
      case 'valid':
        return 'border-green-500 focus:ring-green-500'
      case 'warning':
        return 'border-yellow-500 focus:ring-yellow-500'
      case 'error':
        return 'border-red-500 focus:ring-red-500'
      case 'info':
        return 'border-blue-500 focus:ring-blue-500'
      default:
        return 'border-slate-600 focus:ring-blue-500'
    }
  }

  return (
    <input
      {...props}
      className={`w-full px-4 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 ${getValidationColor()} ${className}`}
    />
  )
}

interface SettingsSliderProps {
  min: number
  max: number
  value: number
  onChange: (value: number) => void
  step?: number
  unit?: string
  showLabels?: boolean
  className?: string
}

export function SettingsSlider({
  min,
  max,
  value,
  onChange,
  step = 1,
  unit,
  showLabels = true,
  className = '',
}: SettingsSliderProps) {
  return (
    <div className={className}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
        style={{
          background: `linear-gradient(to right, #2563eb 0%, #2563eb ${((value - min) / (max - min)) * 100}%, #475569 ${((value - min) / (max - min)) * 100}%, #475569 100%)`,
        }}
      />
      {showLabels && (
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{min} {unit}</span>
          <span className="font-bold text-blue-400">{value} {unit}</span>
          <span>{max} {unit}</span>
        </div>
      )}
    </div>
  )
}

interface SettingsSwitchProps {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
}

export function SettingsSwitch({
  label,
  description,
  checked,
  onChange,
  className = '',
}: SettingsSwitchProps) {
  return (
    <div className={`flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors ${className}`}>
      <div className="flex-1">
        <label className="block text-sm font-bold text-gray-300 mb-1 cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-400">{description}</p>
        )}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  )
}

interface SettingsSelectorProps<T extends string | number> {
  label: string
  description?: string
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
  className?: string
}

export function SettingsSelector<T extends string | number>({
  label,
  description,
  value,
  options,
  onChange,
  className = '',
}: SettingsSelectorProps<T>) {
  return (
    <div className={className}>
      <label className="block text-sm font-bold text-gray-300 mb-2">
        {label}
      </label>
      {description && (
        <p className="text-xs text-gray-400 mb-3">{description}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={String(option.value)}
            onClick={() => onChange(option.value)}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              value === option.value
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
