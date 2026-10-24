import type { BoundingBox } from '../../../services/contracts'

// The API caps a bbox at 2 degrees per side so one call cannot scan the country.
export const MAX_BBOX_DEGREES = 2

// It also has a floor, for a reason that is easy to miss: areas are clustered
// from the incidents inside the requested box, so a small box clusters a small
// set and publishes fewer areas. Zooming in would quietly make reported areas
// disappear. The query therefore always covers at least as much ground as the
// mobile app's fixed region did, whatever the zoom; the map still draws only
// what fits on screen.
export const MIN_BBOX_DEGREES = 0.15

function span(low: number, high: number, limit: number): [number, number] {
  const size = high - low
  if (size >= MIN_BBOX_DEGREES && size <= MAX_BBOX_DEGREES) return [low, high]
  const centre = (low + high) / 2
  const half = Math.min(MAX_BBOX_DEGREES, Math.max(MIN_BBOX_DEGREES, size)) / 2
  return [Math.max(-limit, centre - half), Math.min(limit, centre + half)]
}

export function clampBounds(bounds: BoundingBox): BoundingBox {
  const [south, north] = span(bounds.southWest.latitude, bounds.northEast.latitude, 90)
  const [west, east] = span(bounds.southWest.longitude, bounds.northEast.longitude, 180)
  return {
    southWest: { latitude: south, longitude: west },
    northEast: { latitude: north, longitude: east },
  }
}
