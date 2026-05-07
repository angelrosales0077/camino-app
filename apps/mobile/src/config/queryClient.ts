/**
 * @camino/mobile - React Query Configuration
 */

import { QueryClient } from '@tanstack/react-query'
import { CACHE_TIMES, GC_TIMES } from './constants'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CACHE_TIMES.GOSPEL, // Default 6 hours
      gcTime: GC_TIMES.GOSPEL, // Default 48 hours
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
})
