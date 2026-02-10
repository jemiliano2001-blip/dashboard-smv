import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  getEnvConfig,
  validateEnvVariables,
  getEnvValidationResult,
  type EnvValidationResult as EnvValidationResultType,
} from '../utils/envValidation'

let supabaseClient: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = getEnvConfig()

    supabaseClient = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  }

  return supabaseClient
}

// Safe export that defers initialization until used.
// This avoids crashes on import while still failing fast on first access
// when environment variables are misconfigured.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase()
    return client[prop as keyof SupabaseClient]
  },
}) as SupabaseClient

// Re-export env validation helpers for convenience
export { validateEnvVariables, getEnvValidationResult }
export type EnvValidationResult = EnvValidationResultType
