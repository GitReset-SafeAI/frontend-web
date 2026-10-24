import type { BoundingBox } from '../../../services/contracts'

// The API caps a bbox at 2° per side so one call cannot scan the country.
// The map can be zoomed out past that, so the request is clamped around the
// viewport's centre rather than being sent and rejected.
export const MAX_BBOX_DEGREES = 2

function clampSpan(low: number, high: number, limit: number): [number, number] {
  const span = high - low
  if (span <= MAX_BBOX_DEGREES) return [low, high]
  const centre = (low + high) / 2
  const half = MAX_BBOX_DEGREES / 2
  return [Math.max(-limit, centre - half), Math.min(limit, centre + half)]
}

export function clampBounds(bounds: BoundingBox): BoundingBox {
  const [south, north] = clampSpan(bounds.southWest.latitude, bounds.northEast.latitude, 90)
  const [west, east] = clampSpan(bounds.southWest.longitude, bounds.northEast.longitude, 180)
  return {
    southWest: { latitude: south, longitude: west },
    northEast: { latitude: north, longitude: east },
  }
}
