import { useCallback, useState } from 'react'

import type { ApproximateLocation } from '../../../services/contracts'

export type LocationStatus = 'idle' | 'locating' | 'denied' | 'unavailable'

// Two decimals is roughly 1 km, so a report never carries a precise point.
export function roundCoordinate(value: number): number {
  return Math.round(value * 100) / 100
}

// The browser asks for permission only when the user taps "Use my current location". The exact
// position is rounded immediately and never stored or logged.
export function useApproximateLocation(onLocated: (location: ApproximateLocation) => void) {
  const [status, setStatus] = useState<LocationStatus>('idle')

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable')
      return
    }
    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocated({
          latitude: roundCoordinate(position.coords.latitude),
          longitude: roundCoordinate(position.coords.longitude),
          source: 'device',
        })
        setStatus('idle')
      },
      (error) => { setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable') },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    )
  }, [onLocated])

  return { status, locate }
}
