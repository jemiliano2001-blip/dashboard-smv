/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY?: string
  readonly REACT_APP_SUPABASE_URL?: string
  readonly REACT_APP_SUPABASE_ANON_KEY?: string
  readonly REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY?: string
  readonly NEXT_PUBLIC_SUPABASE_URL?: string
  readonly NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
