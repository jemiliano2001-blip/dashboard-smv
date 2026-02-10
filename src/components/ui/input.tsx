import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`
          w-full px-4 py-2.5 rounded-xl
          bg-zinc-50 dark:bg-zinc-900/50
          border border-zinc-200 dark:border-zinc-700
          text-zinc-900 dark:text-zinc-100
          placeholder:text-zinc-500 dark:placeholder:text-zinc-400
          focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:ring-red-500/50' : ''}
          ${className}
        `}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'
