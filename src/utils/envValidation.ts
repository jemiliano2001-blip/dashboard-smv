/**
 * Validates environment variables at startup
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

  // Check for URL (support VITE_, REACT_APP_, NEXT_PUBLIC_ prefixes)
  const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.REACT_APP_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL
  
  if (!supabaseUrl || typeof supabaseUrl !== 'string' || supabaseUrl.trim() === '') {
    missing.push('VITE_SUPABASE_URL, REACT_APP_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_URL')
  } else if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
    errors.push('La URL de Supabase debe comenzar con http:// o https://')
  }

  // Check for key (support multiple formats)
  const supabaseKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    import.meta.env.REACT_APP_SUPABASE_ANON_KEY ||
    import.meta.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

  if (!supabaseKey || typeof supabaseKey !== 'string' || supabaseKey.trim() === '') {
    missing.push('VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY, REACT_APP_*, o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY')
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
      ...validation.missing.map(key => `Missing: ${key}`),
      ...validation.errors,
    ]
    throw new Error(`Environment validation failed:\n${errorMessages.join('\n')}`)
  }

  // Get values with fallback support
  const url =
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.REACT_APP_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    import.meta.env.REACT_APP_SUPABASE_ANON_KEY ||
    import.meta.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

  if (!url || !key) {
    throw new Error('Supabase configuration is incomplete')
  }

  return {
    VITE_SUPABASE_URL: url,
    VITE_SUPABASE_ANON_KEY: key,
  }
}
