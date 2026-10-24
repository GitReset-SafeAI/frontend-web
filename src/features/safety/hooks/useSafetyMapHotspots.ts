import { useQuery } from '@tanstack/react-query'

import { env } from '../../../config/env'
import { services } from '../../../services'
import type { HotspotsRequest } from '../../../services/contracts'
import { queryKeys } from '../../../services/queryKeys'

export function useSafetyMapHotspots(request: HotspotsRequest) {
  return useQuery({
    queryKey: queryKeys.safetyMapHotspots(request),
    queryFn: () => services.safetyMap.getHotspots(request),
    // Clustering is expensive server-side; a short pan should not refetch.
    staleTime: 30 * 1000,
    refetchInterval: env.safetyMapMode === 'api' ? 60 * 1000 : false,
    // Mock data is local, so demos also work offline.
    networkMode: env.safetyMapMode === 'mock' ? 'always' : 'online',
  })
}
