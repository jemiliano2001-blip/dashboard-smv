import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { logger } from '../utils/logger'

// Support VITE_, REACT_APP_, and NEXT_PUBLIC_ prefixes for compatibility
const supabaseUrl: string | undefined =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.REACT_APP_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey: string | undefined =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  import.meta.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  import.meta.env.REACT_APP_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Debug: Log env variables in development (only first few chars of key for security)
if (import.meta.env.DEV) {
  logger.debug('Environment variables check', {
    feature: 'supabase',
    action: 'env_check',
    viteSupabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
    viteSupabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ? 'Set' : 'Missing',
    reactAppSupabaseUrl: import.meta.env.REACT_APP_SUPABASE_URL ? 'Set' : 'Missing',
    resolvedUrl: supabaseUrl ? 'Found' : 'Not found',
    resolvedKey: supabaseAnonKey ? 'Found' : 'Not found',
  })
}

export interface EnvValidationResult {
  valid: boolean
  missing: string[]
  errors: string[]
}

export function validateEnvVariables(): EnvValidationResult {
  const missing: string[] = []
  const errors: string[] = []

  if (!supabaseUrl || typeof supabaseUrl !== 'string' || supabaseUrl.trim() === '') {
    missing.push('VITE_SUPABASE_URL o REACT_APP_SUPABASE_URL')
  }

  if (!supabaseAnonKey || typeof supabaseAnonKey !== 'string' || supabaseAnonKey.trim() === '') {
    missing.push('VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY, REACT_APP_SUPABASE_ANON_KEY o REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY')
  }

  if (supabaseUrl && !supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
    errors.push('VITE_SUPABASE_URL must be a valid URL starting with http:// or https://')
  }

  const valid = missing.length === 0 && errors.length === 0

  if (!valid) {
    const errorMessage = missing.length > 0
      ? `Missing or invalid Supabase environment variables: ${missing.join(', ')}. Please check your .env file.`
      : errors.join(', ')
    logger.error('Environment validation failed', new Error(errorMessage), {
      feature: 'supabase',
      action: 'init',
      missingVariables: missing,
      errors,
    })
  }

  return { valid, missing, errors }
}

let supabaseInstance: SupabaseClient | null = null
let validationResult: EnvValidationResult | null = null

function initializeSupabase(): SupabaseClient {
  if (!validationResult) {
    validationResult = validateEnvVariables()
  }

  if (!validationResult.valid) {
    const errorMessage = validationResult.missing.length > 0
      ? `Missing or invalid Supabase environment variables: ${validationResult.missing.join(', ')}. Please check your .env file.`
      : validationResult.errors.join(', ')
    throw new Error(errorMessage)
  }

  if (!supabaseInstance) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase environment variables are required')
    }
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  }

  return supabaseInstance
}

// Export validation function for use in components
export function getEnvValidationResult(): EnvValidationResult {
  if (!validationResult) {
    validationResult = validateEnvVariables()
  }
  return validationResult
}

// Create supabase client lazily - will throw error if env vars are missing when first accessed
// This allows App.tsx to check validation before components try to use it
let supabaseProxy: SupabaseClient | null = null

function getSupabaseInstance(): SupabaseClient {
  if (!supabaseProxy) {
    supabaseProxy = initializeSupabase()
  }
  return supabaseProxy
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const instance = getSupabaseInstance()
    const value = instance[prop as keyof SupabaseClient]
    if (typeof value === 'function') {
      const func = value as (...args: unknown[]) => unknown
      return (...args: unknown[]) => {
        const result = func.apply(instance, args)
        // If the result is an object with methods, we need to bind them too
        if (result && typeof result === 'object' && result !== null) {
          return new Proxy(result as Record<string, unknown>, {
            get(target, propKey) {
              const val = target[propKey as string]
              if (typeof val === 'function') {
                return (val as (...args: unknown[]) => unknown).bind(target)
              }
              return val
            },
          })
        }
        return result
      }
    }
    return value
  },
}) as SupabaseClient
