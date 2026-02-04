import { vi } from 'vitest'

export const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      order: vi.fn(() => ({
        data: [],
        error: null,
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({
          data: null,
          error: null,
        })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => ({
        data: null,
        error: null,
      })),
    })),
  })),
  channel: vi.fn(() => ({
    on: vi.fn(() => ({
      subscribe: vi.fn(() => 'SUBSCRIBED'),
    })),
  })),
  removeChannel: vi.fn(),
}
