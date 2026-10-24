import { useMutation } from '@tanstack/react-query'

import { env } from '../../../config/env'
import { services } from '../../../services'
import type { RouteComparisonRequest } from '../../../services/contracts'

export function useRouteComparison() {
  return useMutation({
    mutationFn: (request: RouteComparisonRequest) => services.safetyMap.compareRoutes(request),
    networkMode: env.dataMode === 'mock' ? 'always' : 'online',
  })
}
