import { createClient, type SupabaseClient } from '@supabase/supabase-js'

interface SupabaseEnvConfig {
  url: string
  anonKey: string
}

function resolveSupabaseEnv(): SupabaseEnvConfig {
  const url =
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL

  const anonKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const missing: string[] = []

  if (!url) {
    missing.push('VITE_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!anonKey) {
    missing.push('VITE_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing Supabase environment variables: ${missing.join(
        ', ',
      )}. Please check your Vite environment configuration.`,
    )
  }

  return {
    url,
    anonKey,
  }
}

let supabaseClient: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    const { url, anonKey } = resolveSupabaseEnv()

    supabaseClient = createClient(url, anonKey, {
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
