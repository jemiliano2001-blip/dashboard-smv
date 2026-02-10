/**
 * Validates Supabase-related environment variables at startup.
 * Primary variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 * Fallbacks: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

interface EnvConfig {
  VITE_SUPABASE_URL: string
  VITE_SUPABASE_ANON_KEY: string
}

interface ValidationResult {
  valid: boolean
  missing: string[]
  errors: string[]
}

export function validateEnvVariables(): ValidationResult {
  const missing: string[] = []
  const errors: string[] = []

  const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl || typeof supabaseUrl !== 'string' || supabaseUrl.trim() === '') {
    missing.push('VITE_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
  } else if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
    errors.push('Supabase URL must start with http:// or https://')
  }

  const supabaseKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseKey || typeof supabaseKey !== 'string' || supabaseKey.trim() === '') {
    missing.push('VITE_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return {
    valid: missing.length === 0 && errors.length === 0,
    missing,
    errors,
  }
}

export function getEnvConfig(): EnvConfig {
  const validation = validateEnvVariables()

  if (!validation.valid) {
    const errorMessages = [
      ...validation.missing.map((key) => `Missing: ${key}`),
      ...validation.errors,
    ]
    throw new Error(`Environment validation failed:\n${errorMessages.join('\n')}`)
  }

  const url =
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL

  const key =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Supabase configuration is incomplete')
  }

  return {
    VITE_SUPABASE_URL: url,
    VITE_SUPABASE_ANON_KEY: key,
  }
}
