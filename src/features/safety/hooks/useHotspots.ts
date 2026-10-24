import { useQuery } from '@tanstack/react-query'

import { env } from '../../../config/env'
import { services } from '../../../services'
import { queryKeys } from '../../../services/queryKeys'

export function useHotspots() {
  return useQuery({
    queryKey: queryKeys.hotspots,
    queryFn: () => services.hotspots.listHotspots(),
    // Mock data is local, so demos also work offline.
    networkMode: env.dataMode === 'mock' ? 'always' : 'online',
  })
}
