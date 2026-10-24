import { useCallback, useEffect, useRef, useState } from 'react'

import { services } from '../../../services'
import type { Coordinate, Route, SafetyMapHotspot } from '../../../services/contracts'

export interface JourneyEndpoint {
  label: string
  coordinate: Coordinate
}

export interface LiveJourney {
  position: Coordinate | null
  accuracyMeters: number | null
  // Metres still to walk along the chosen route, from the nearest point on it.
  remainingMeters: number | null
  remainingSeconds: number | null
  arrived: boolean
  // Areas whose circle the traveller is currently inside. Named rather than
  // counted, because "you are in a reported area" is the useful sentence.
  insideAreas: SafetyMapHotspot[]
  status: 'idle' | 'locating' | 'following' | 'denied' | 'unavailable'
  shareUrl: string | null
  sharing: boolean
  shareError: boolean
}

const EARTH_RADIUS_M = 6_371_000
const ARRIVAL_RADIUS_M = 75
// The backend is told where the traveller is at most this often. Following is
// smooth locally; the share does not need every GPS tick, and a slower rate is
// less location data leaving the device.
const SHARE_INTERVAL_MS = 10_000

function haversineM(a: Coordinate, b: Coordinate): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLon = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

// Distance left along the route, measured from whichever of its points is
// nearest. Walking off-route then shortens as you rejoin, rather than jumping.
function remainingAlong(route: Route, position: Coordinate): number {
  let nearest = 0
  let best = Infinity
  route.geometry.forEach((point, index) => {
    const distance = haversineM(point, position)
    if (distance < best) {
      best = distance
      nearest = index
    }
  })
  let total = 0
  for (let i = nearest; i < route.geometry.length - 1; i += 1) {
    total += haversineM(route.geometry[i], route.geometry[i + 1])
  }
  return total
}

/**
 * Follows the traveller along a chosen route, and optionally shares that with
 * one link.
 *
 * Location never leaves the browser unless sharing is started explicitly, and
 * stops leaving the moment the journey ends: ending deletes the share server
 * side rather than hiding it.
 */
export function useLiveJourney(route: Route | null, destination: JourneyEndpoint | null, areas: SafetyMapHotspot[]) {
  const [position, setPosition] = useState<Coordinate | null>(null)
  const [accuracyMeters, setAccuracy] = useState<number | null>(null)
  const [status, setStatus] = useState<LiveJourney['status']>('idle')
  const [share, setShare] = useState<{ shareId: string; ownerKey: string } | null>(null)
  const [sharing, setSharing] = useState(false)
  const [shareError, setShareError] = useState(false)

  const watchId = useRef<number | null>(null)
  const lastSent = useRef(0)
  const shareRef = useRef<typeof share>(null)
  shareRef.current = share

  const stopWatching = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
  }, [])

  const start = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable')
      return
    }
    setStatus('locating')
    watchId.current = navigator.geolocation.watchPosition(
      (fix) => {
        const next = { latitude: fix.coords.latitude, longitude: fix.coords.longitude }
        setPosition(next)
        setAccuracy(fix.coords.accuracy)
        setStatus('following')

        // Throttled, and only ever while a share is live.
        const current = shareRef.current
        const now = Date.now()
        if (current && now - lastSent.current >= SHARE_INTERVAL_MS) {
          lastSent.current = now
          void services.journeys
            .updatePosition(current.shareId, current.ownerKey, next, fix.coords.accuracy ?? null)
            .catch(() => { setShareError(true) })
        }
      },
      (error) => {
        setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable')
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 5_000 },
    )
  }, [])

  const stop = useCallback(async () => {
    stopWatching()
    const current = shareRef.current
    setShare(null)
    setSharing(false)
    setStatus('idle')
    setPosition(null)
    if (current) {
      // Ending removes the share rather than leaving it to expire.
      await services.journeys.end(current.shareId, current.ownerKey).catch(() => undefined)
    }
  }, [stopWatching])

  const startSharing = useCallback(async () => {
    if (!route || !destination) return
    setSharing(true)
    setShareError(false)
    try {
      const created = await services.journeys.start({
        origin: route.geometry[0],
        destination: destination.coordinate,
        originLabel: '',
        destinationLabel: destination.label.slice(0, 80),
        geometry: route.geometry,
        durationSeconds: route.durationSeconds,
      })
      setShare({ shareId: created.shareId, ownerKey: created.ownerKey })
      lastSent.current = 0
    } catch {
      setShareError(true)
      setSharing(false)
    }
  }, [route, destination])

  // A journey must not keep watching after the screen is gone.
  useEffect(() => stopWatching, [stopWatching])

  const remainingMeters = route && position ? remainingAlong(route, position) : null
  const arrived =
    position !== null && destination !== null
      ? haversineM(position, destination.coordinate) <= ARRIVAL_RADIUS_M
      : false

  return {
    position,
    accuracyMeters,
    remainingMeters,
    remainingSeconds:
      remainingMeters === null ? null : Math.round(remainingMeters / 1.35),
    arrived,
    insideAreas: position
      ? areas.filter((area) => haversineM(position, area.center) <= area.radiusM)
      : [],
    status,
    shareUrl: share ? `${window.location.origin}/j/${share.shareId}` : null,
    sharing,
    shareError,
    start,
    stop,
    startSharing,
  }
}
