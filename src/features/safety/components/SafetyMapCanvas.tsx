import 'leaflet/dist/leaflet.css'

import L from 'leaflet'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Circle, CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'

import type { BoundingBox, Coordinate, Route, SafetyMapHotspot } from '../../../services/contracts'
import { hotspotFill, mapColors } from '../constants/issueTypes'

interface SafetyMapCanvasProps {
  hotspots: SafetyMapHotspot[]
  routes: Route[]
  selectedRouteId: string | null
  origin: Coordinate | null
  destination: Coordinate | null
  originLabel: string
  destinationLabel: string
  hotspotLabel: (hotspot: SafetyMapHotspot) => string
  routeLabel: (route: Route) => string
  initialBounds: BoundingBox
  onHotspotSelect: (hotspot: SafetyMapHotspot) => void
  onRouteSelect: (routeId: string) => void
  onBoundsChange: (bounds: BoundingBox) => void
}

const toLatLng = ({ latitude, longitude }: Coordinate): [number, number] => [latitude, longitude]

function toBoundingBox(bounds: L.LatLngBounds): BoundingBox {
  const sw = bounds.getSouthWest()
  const ne = bounds.getNorthEast()
  return {
    southWest: { latitude: sw.lat, longitude: sw.lng },
    northEast: { latitude: ne.lat, longitude: ne.lng },
  }
}

// The areas shown follow the map, rather than a region fixed in the source.
// Panning is debounced: the query key rounds bounds to two decimals, so a small
// nudge reuses the cached result instead of asking the server again.
function ViewportReporter({ onBoundsChange }: { onBoundsChange: (bounds: BoundingBox) => void }) {
  const map = useMapEvents({
    moveend: () => { onBoundsChange(toBoundingBox(map.getBounds())) },
    zoomend: () => { onBoundsChange(toBoundingBox(map.getBounds())) },
  })
  return null
}

// Frame the journey once routes arrive, the way a map app zooms to fit.
function FitToRoutes({ routes }: { routes: Route[] }) {
  const map = useMap()
  useEffect(() => {
    const points = routes.flatMap((route) => route.geometry)
    if (points.length < 2) return
    map.fitBounds(L.latLngBounds(points.map(toLatLng)), { padding: [48, 48] })
  }, [map, routes])
  return null
}

export function SafetyMapCanvas({
  hotspots,
  routes,
  selectedRouteId,
  origin,
  destination,
  originLabel,
  destinationLabel,
  hotspotLabel,
  routeLabel,
  initialBounds,
  onHotspotSelect,
  onRouteSelect,
  onBoundsChange,
}: SafetyMapCanvasProps) {
  const { t } = useTranslation('safety')
  const center: [number, number] = [
    (initialBounds.southWest.latitude + initialBounds.northEast.latitude) / 2,
    (initialBounds.southWest.longitude + initialBounds.northEast.longitude) / 2,
  ]

  return (
    <div
      data-testid="safety-map"
      role="application"
      aria-label={t('mapA11y')}
      className="h-[26rem] overflow-hidden rounded-lg border border-line/70 shadow-card lg:h-[32rem]"
    >
      <MapContainer center={center} zoom={12} scrollWheelZoom className="size-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <ViewportReporter onBoundsChange={onBoundsChange} />
        <FitToRoutes routes={routes} />

        {/* One shaded circle per aggregated area. Individual reports are never
            plotted, and the radius is the published aggregation radius. */}
        {hotspots.map((hotspot) => (
          <Circle
            key={`area-${hotspot.id}`}
            center={toLatLng(hotspot.center)}
            radius={hotspot.radiusM}
            pathOptions={{
              fillColor: hotspotFill(hotspot.intensity),
              fillOpacity: 1,
              color: mapColors.area,
              weight: 1,
            }}
            eventHandlers={{ click: () => { onHotspotSelect(hotspot) } }}
          >
            <Tooltip>{hotspotLabel(hotspot)}</Tooltip>
          </Circle>
        ))}

        {/* The report count sits on the area, so the meaning never rests on
            the shading alone. */}
        {hotspots.map((hotspot) => (
          <CircleMarker
            key={`count-${hotspot.id}`}
            center={toLatLng(hotspot.center)}
            radius={14}
            pathOptions={{ fillColor: mapColors.area, fillOpacity: 1, color: '#ffffff', weight: 2 }}
            eventHandlers={{ click: () => { onHotspotSelect(hotspot) } }}
          >
            <Tooltip permanent direction="center" className="safety-map-count">
              {String(hotspot.reportCount)}
            </Tooltip>
          </CircleMarker>
        ))}

        {/* Unselected routes stay visible so their issues can be compared, and
            the selected one is drawn last so it sits on top. */}
        {[...routes]
          .sort((a, b) => Number(a.id === selectedRouteId) - Number(b.id === selectedRouteId))
          .map((route) => (
            <Polyline
              key={route.id}
              positions={route.geometry.map(toLatLng)}
              pathOptions={{
                color: route.id === selectedRouteId ? mapColors.routeSelected : mapColors.routeOther,
                weight: route.id === selectedRouteId ? 7 : 4,
                opacity: 1,
              }}
              eventHandlers={{ click: () => { onRouteSelect(route.id) } }}
            >
              <Tooltip sticky>{routeLabel(route)}</Tooltip>
            </Polyline>
          ))}

        {/* Walking time sits on each route, as on a familiar map, so the cost
            of a longer but clear route is visible without hovering. */}
        {routes.map((route) => {
          const midpoint = route.geometry[Math.floor(route.geometry.length / 2)]
          if (!midpoint) return null
          const selected = route.id === selectedRouteId
          const minutes = Math.max(1, Math.round(route.durationSeconds / 60))
          const extra = Math.round(route.extraDurationSeconds / 60)
          return (
            <CircleMarker
              key={`duration-${route.id}`}
              center={toLatLng(midpoint)}
              radius={1}
              pathOptions={{ opacity: 0, fillOpacity: 0 }}
              eventHandlers={{ click: () => { onRouteSelect(route.id) } }}
            >
              <Tooltip
                permanent
                direction="center"
                className={`safety-map-duration${selected ? ' is-selected' : ''}`}
              >
                {extra > 0
                  ? `${t('routes.duration', { minutes })} · ${t('routes.extraTime', { minutes: extra })}`
                  : t('routes.duration', { minutes })}
              </Tooltip>
            </CircleMarker>
          )
        })}

        {origin ? (
          <CircleMarker
            center={toLatLng(origin)}
            radius={9}
            pathOptions={{ fillColor: mapColors.origin, fillOpacity: 1, color: '#ffffff', weight: 3 }}
          >
            <Tooltip>{originLabel}</Tooltip>
          </CircleMarker>
        ) : null}

        {destination ? (
          <CircleMarker
            center={toLatLng(destination)}
            radius={9}
            pathOptions={{ fillColor: mapColors.destination, fillOpacity: 1, color: '#ffffff', weight: 3 }}
          >
            <Tooltip>{destinationLabel}</Tooltip>
          </CircleMarker>
        ) : null}
      </MapContainer>
    </div>
  )
}
