import 'leaflet/dist/leaflet.css'

import L from 'leaflet'
import { useEffect } from 'react'
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'

import type { Coordinate, SharedJourney } from '../../../services/contracts'
import { mapColors } from '../constants/issueTypes'

const toLatLng = ({ latitude, longitude }: Coordinate): [number, number] => [latitude, longitude]

const destinationPin = L.divIcon({
  className: 'safety-map-pin',
  html: `<svg viewBox="0 0 24 32" width="30" height="40" aria-hidden="true">
    <path d="M12 1.5c5 0 9.5 4 9.5 9.3 0 6.6-7.6 14.2-9 19.2-.2.6-.8.6-1 0-1.4-5-9-12.6-9-19.2C2.5 5.5 7 1.5 12 1.5Z"
      fill="#E9736B" stroke="#133148" stroke-width="1.6"/>
    <circle cx="12" cy="10.8" r="3.4" fill="#133148"/>
  </svg>`,
  iconSize: [30, 40],
  iconAnchor: [15, 38],
})

// Keep the traveller in view as they move, without fighting a viewer who pans.
function FollowPosition({ position }: { position: Coordinate | null }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.panTo(toLatLng(position), { animate: true })
  }, [map, position])
  return null
}

export function SharedJourneyMap({ journey }: { journey: SharedJourney }) {
  const centre = journey.position ?? journey.destination
  return (
    <div
      data-testid="shared-journey-map"
      className="safety-map h-[24rem] overflow-hidden rounded-lg border border-line/70 shadow-lift lg:h-[30rem]"
    >
      <MapContainer center={toLatLng(centre)} zoom={15} scrollWheelZoom className="size-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <FollowPosition position={journey.position} />

        <Polyline
          positions={journey.geometry.map(toLatLng)}
          interactive={false}
          pathOptions={{ color: '#ffffff', weight: 11, opacity: 0.9, lineCap: 'round' }}
        />
        <Polyline
          positions={journey.geometry.map(toLatLng)}
          interactive={false}
          pathOptions={{ color: mapColors.routeSelected, weight: 6, lineCap: 'round' }}
        />

        <Marker position={toLatLng(journey.destination)} icon={destinationPin} />

        {/* The accuracy circle is drawn, so a wide fix is never read as a
            precise one. */}
        {journey.position && journey.accuracyMeters ? (
          <CircleMarker
            center={toLatLng(journey.position)}
            radius={Math.min(60, Math.max(14, journey.accuracyMeters / 4))}
            pathOptions={{ fillColor: mapColors.origin, fillOpacity: 0.15, color: mapColors.origin, weight: 1, opacity: 0.4 }}
          />
        ) : null}

        {journey.position ? (
          <CircleMarker
            center={toLatLng(journey.position)}
            radius={9}
            pathOptions={{ fillColor: mapColors.origin, fillOpacity: 1, color: '#ffffff', weight: 4 }}
          >
            <Tooltip permanent direction="top" className="safety-map-duration is-selected">
              {journey.destinationLabel || ''}
            </Tooltip>
          </CircleMarker>
        ) : null}
      </MapContainer>
    </div>
  )
}
