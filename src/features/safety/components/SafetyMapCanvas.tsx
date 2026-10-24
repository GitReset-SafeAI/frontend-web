import 'leaflet/dist/leaflet.css'

import L from 'leaflet'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Circle, CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip, ZoomControl, useMap, useMapEvents } from 'react-leaflet'

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

// The logo's coral pin, standing on the destination. Coral is the brand accent
// and carries navy, never white, so the pin keeps a navy outline and tip.
const destinationPin = L.divIcon({
  className: 'safety-map-pin',
  html: `<svg viewBox="0 0 24 32" width="30" height="40" aria-hidden="true">
    <path d="M12 1.5c5 0 9.5 4 9.5 9.3 0 6.6-7.6 14.2-9 19.2-.2.6-.8.6-1 0-1.4-5-9-12.6-9-19.2C2.5 5.5 7 1.5 12 1.5Z"
      fill="#E9736B" stroke="#133148" stroke-width="1.6"/>
    <circle cx="12" cy="10.8" r="3.4" fill="#133148"/>
  </svg>`,
  iconSize: [30, 40],
  iconAnchor: [15, 38],
  tooltipAnchor: [0, -34],
})

// Areas shown follow the map rather than a region fixed in the source. Panning
// is cheap: the query key rounds bounds to two decimals, so a small nudge
// reuses the cached result instead of asking the server again.
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
    map.fitBounds(L.latLngBounds(points.map(toLatLng)), { padding: [56, 56] })
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
  // Selected last, so it is drawn on top of the others.
  const ordered = [...routes].sort(
    (a, b) => Number(a.id === selectedRouteId) - Number(b.id === selectedRouteId),
  )

  return (
    <div
      data-testid="safety-map"
      role="application"
      aria-label={t('mapA11y')}
      className="safety-map h-[26rem] overflow-hidden rounded-lg border border-line/70 shadow-lift lg:h-[34rem]"
    >
      <MapContainer center={center} zoom={13} scrollWheelZoom zoomControl={false} className="size-full">
        {/* OpenStreetMap's own tiles: no API key, and the same data the
            routing and place search already use. They are bright, so they are
            desaturated in CSS instead, letting the reported areas and the
            route carry the colour. */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        {/* Bottom right, clear of the route labels that sit mid-map. */}
        <ZoomControl position="bottomright" />
        <ViewportReporter onBoundsChange={onBoundsChange} />
        <FitToRoutes routes={routes} />

        {/* One shaded circle per aggregated area. Individual reports are never
            plotted, and the radius is the published aggregation radius. An
            area with insufficient evidence is drawn dashed and faint, so a
            thinly-reported place is never read as a confident one. */}
        {hotspots.map((hotspot) => {
          const thin = hotspot.evidenceLevel === 'insufficient'
          return (
            <Circle
              key={`area-${hotspot.id}`}
              center={toLatLng(hotspot.center)}
              radius={hotspot.radiusM}
              pathOptions={{
                fillColor: hotspotFill(hotspot.intensity),
                fillOpacity: 1,
                color: mapColors.area,
                weight: thin ? 1.5 : 2,
                dashArray: thin ? '5 5' : undefined,
                opacity: thin ? 0.55 : 0.85,
              }}
              eventHandlers={{ click: () => { onHotspotSelect(hotspot) } }}
            >
              <Tooltip>{hotspotLabel(hotspot)}</Tooltip>
            </Circle>
          )
        })}

        {/* The report count sits on the area, so meaning never rests on the
            shading alone. */}
        {hotspots.map((hotspot) => (
          <CircleMarker
            key={`count-${hotspot.id}`}
            center={toLatLng(hotspot.center)}
            radius={15}
            pathOptions={{ fillColor: mapColors.area, fillOpacity: 1, color: '#ffffff', weight: 2.5 }}
            eventHandlers={{ click: () => { onHotspotSelect(hotspot) } }}
          >
            <Tooltip permanent direction="center" className="safety-map-count">
              {String(hotspot.reportCount)}
            </Tooltip>
          </CircleMarker>
        ))}

        {/* Casing under the line, as a street map draws a road: it separates
            the route from the basemap and from the other routes. */}
        {ordered.map((route) => (
          <Polyline
            key={`casing-${route.id}`}
            positions={route.geometry.map(toLatLng)}
            interactive={false}
            pathOptions={{
              color: '#ffffff',
              weight: route.id === selectedRouteId ? 12 : 8,
              opacity: 0.9,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        ))}

        {ordered.map((route) => {
          const selected = route.id === selectedRouteId
          return (
            <Polyline
              key={route.id}
              positions={route.geometry.map(toLatLng)}
              pathOptions={{
                color: selected ? mapColors.routeSelected : mapColors.routeOther,
                weight: selected ? 6 : 4,
                opacity: selected ? 1 : 0.85,
                lineCap: 'round',
                lineJoin: 'round',
                dashArray: selected ? undefined : '1 9',
              }}
              eventHandlers={{ click: () => { onRouteSelect(route.id) } }}
            >
              <Tooltip sticky>{routeLabel(route)}</Tooltip>
            </Polyline>
          )
        })}

        {/* Walking time sits on each route, as on a familiar map, so the cost
            of a longer but clear route is visible without hovering. */}
        {routes.map((route, index) => {
          // Routes in the same corridor have midpoints within metres of each
          // other, so the labels are spread along their own paths instead.
          const fraction = [0.5, 0.3, 0.7, 0.2][index % 4]
          const midpoint = route.geometry[Math.floor(route.geometry.length * fraction)]
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

        {/* The journey reads start to finish: a navy ring where you set off,
            the coral pin where you are going. */}
        {origin ? (
          <CircleMarker
            center={toLatLng(origin)}
            radius={8}
            pathOptions={{ fillColor: '#ffffff', fillOpacity: 1, color: mapColors.origin, weight: 5 }}
          >
            <Tooltip>{originLabel}</Tooltip>
          </CircleMarker>
        ) : null}

        {destination ? (
          <Marker position={toLatLng(destination)} icon={destinationPin}>
            <Tooltip>{destinationLabel}</Tooltip>
          </Marker>
        ) : null}
      </MapContainer>
    </div>
  )
}
