/**
 * Supabase database types (auto-generated).
 * Run `npm run update-types` to regenerate from your project schema.
 * Requires SUPABASE_PROJECT_ID in .env or VITE_SUPABASE_URL from which the project ref is derived.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
