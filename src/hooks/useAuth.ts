import type { User } from '@supabase/supabase-js'

// TODO: Auth bypassed temporarily for development - restore original useAuth when done
interface UseAuthReturn {
  user: User | null
  loading: boolean
  error: string | null
  signInWithEmail: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

const FAKE_USER = { id: 'dev-bypass', email: 'dev@local' } as User

export function useAuth(): UseAuthReturn {
  return {
    user: FAKE_USER,
    loading: false,
    error: null,
    signInWithEmail: async () => {},
    signOut: async () => {},
  }
}

