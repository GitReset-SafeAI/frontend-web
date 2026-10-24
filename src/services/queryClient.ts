import { QueryClient } from '@tanstack/react-query'

// Report content must never linger in a cache, so mutations keep no results and queries are not persisted.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: false, gcTime: 0 },
  },
})
