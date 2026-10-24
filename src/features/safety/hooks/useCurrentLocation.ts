import { useCallback, useState } from 'react'

import type { Coordinate } from '../../../services/contracts'

// On-demand location only. Nothing is requested until the user explicitly asks
// for their current position, and no position is stored or sent anywhere by
// this hook. The browser's own permission prompt is the only gate.
export function useCurrentLocation() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'denied' | 'unavailable'>('idle')

  const request = useCallback(async (): Promise<Coordinate | null> => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable')
      return null
    }
    setStatus('loading')
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10_000,
          maximumAge: 60_000,
        })
      })
      setStatus('idle')
      return { latitude: position.coords.latitude, longitude: position.coords.longitude }
    } catch (error) {
      // A refused prompt is reported separately from a failure, because the
      // two need different wording. Raw platform errors are never surfaced.
      const denied =
        typeof GeolocationPositionError !== 'undefined' &&
        error instanceof GeolocationPositionError &&
        error.code === GeolocationPositionError.PERMISSION_DENIED
      setStatus(denied ? 'denied' : 'unavailable')
      return null
    }
  }, [])

  return { status, request }
}
