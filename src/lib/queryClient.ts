/**
 * React Query client configuration
 */

import { QueryClient } from '@tanstack/react-query'
import { logger } from '../utils/logger'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds - data is fresh for 30s
      gcTime: 5 * 60 * 1000, // 5 minutes - cache for 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error && /\b4\d{2}\b/.test(error.message)) {
          return false
        }
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        logger.error('Mutation error', error as Error, {
          feature: 'react-query',
          action: 'mutation_error',
        })
      },
    },
  },
})
