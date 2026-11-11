import 'leaflet/dist/leaflet.css'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Circle, CircleMarker, MapContainer, TileLayer, useMap } from 'react-leaflet'
import { ApiError } from '../../../services/api/ApiError'
import { emergencyLocation } from '../../../services/api/emergencyLocation'
import { InfoNote } from '../../../shared/components/InfoNote'
import { Spinner } from '../../../shared/components/Spinner'

function Follow({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap()
  useEffect(() => { map.panTo([latitude, longitude]) }, [map, latitude, longitude])
  return null
}

export function SharedEmergencyLocationPage() {
  const { t } = useTranslation('emergency')
  const { shareId = '' } = useParams()
  const [now, setNow] = useState(Date.now)
  const location = useQuery({
    queryKey: ['emergency-location', shareId], queryFn: () => emergencyLocation.read(shareId),
    retry: false, refetchInterval: (query) => query.state.error instanceof ApiError && query.state.error.status === 404 ? false : 5_000,
  })
  useEffect(() => {
    const timer = setInterval(() => { setNow(Date.now()) }, 5_000)
    const robots = document.createElement('meta')
    robots.name = 'robots'; robots.content = 'noindex, nofollow'
    const referrer = document.createElement('meta')
    referrer.name = 'referrer'; referrer.content = 'no-referrer'
    document.head.append(robots, referrer)
    return () => { clearInterval(timer); robots.remove(); referrer.remove() }
  }, [])
  const data = location.isError ? undefined : location.data
  const expired = data ? now >= Date.parse(data.expires_at) : false
  const stale = data ? now - Date.parse(data.updated_at) > 30_000 : false
  return <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-8 sm:px-6">
    <h1 className="display-md">{t('sms.trackingTitle')}</h1>
    {location.isPending ? <Spinner label={t('sms.loading')} /> : null}
    {location.isError || expired ? <InfoNote tone="error" text={t('sms.ended')} /> : null}
    {data && !expired ? <>
      <p className="m-0">{t('sms.updated', { time: new Date(data.updated_at).toLocaleString() })}</p>
      {stale ? <InfoNote tone="error" text={t('sms.stale')} /> : null}
      <div className="h-96 overflow-hidden rounded-lg border border-line" data-testid="emergency-location-map">
        <MapContainer center={[data.position.latitude, data.position.longitude]} zoom={16} className="size-full">
          <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            referrerPolicy="no-referrer" />
          <Follow {...data.position} />
          <Circle center={[data.position.latitude, data.position.longitude]} radius={data.accuracy_m} />
          <CircleMarker center={[data.position.latitude, data.position.longitude]} radius={8} />
        </MapContainer>
      </div>
      <p className="m-0">{t('sms.accuracy', { metres: Math.round(data.accuracy_m) })}</p>
      <p className="m-0 text-sm text-ink-muted">{t('sms.expires', { time: new Date(data.expires_at).toLocaleString() })}</p>
    </> : null}
    <InfoNote text={t('sms.viewerNote')} />
  </div>
}
