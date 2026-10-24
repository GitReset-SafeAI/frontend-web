import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type {
  BoundingBox,
  HotspotsRequest,
  PlaceSuggestion,
  SafetyMapHotspot,
  TimePeriodFilter,
} from '../../../services/contracts'
import { InfoNote } from '../../../shared/components/InfoNote'
import { Spinner } from '../../../shared/components/Spinner'
import { JourneyPanel } from '../components/JourneyPanel'
import { JourneyPlanner, type PlannerPoint, type PlannerTarget } from '../components/JourneyPlanner'
import { EstimateLimitsNote } from '../components/EstimateLimitsNote'
import { MapEvidenceNotice } from '../components/MapEvidenceNotice'
import { RouteComparisonCard } from '../components/RouteComparisonCard'
import { SafetyAreaList } from '../components/SafetyAreaList'
import { SafetyMapCanvas } from '../components/SafetyMapCanvas'
import { TimePeriodSelector } from '../components/TimePeriodSelector'
import { useCurrentLocation } from '../hooks/useCurrentLocation'
import { useLiveJourney } from '../hooks/useLiveJourney'
import { useRouteComparison } from '../hooks/useRouteComparison'
import { useSafetyMapHotspots } from '../hooks/useSafetyMapHotspots'
import { clampBounds } from '../utils/clampBounds'
import { currentTimePeriod } from '../utils/currentTimePeriod'
import { intensityBand } from '../constants/issueTypes'

// Where the map opens, not where the data lives: panning replaces these bounds
// with whatever is on screen. Not a user's or an incident's location.
const initialBounds: BoundingBox = {
  southWest: { latitude: 6.78, longitude: 79.8 },
  northEast: { latitude: 7.0, longitude: 79.95 },
}

// Two viewports that round to the same key cannot produce different areas.
function boundsKey({ southWest, northEast }: BoundingBox) {
  return [
    southWest.latitude, southWest.longitude, northEast.latitude, northEast.longitude,
  ].map((value) => value.toFixed(2)).join(',')
}

// Routes are compared on foot. The backend still takes a travel mode, so the
// value is pinned here rather than asked for.
const TRAVEL_MODE = 'walking' as const

export function SafetyMapSection() {
  const { t } = useTranslation('safety')
  // Show all recorded periods initially so the current clock does not hide stored reports.
  const [timePeriod, setTimePeriod] = useState<TimePeriodFilter>('all')
  const [bounds, setBounds] = useState<BoundingBox>(initialBounds)
  const [origin, setOrigin] = useState<PlannerPoint | null>(null)
  const [destination, setDestination] = useState<PlannerPoint | null>(null)
  const [selectedHotspot, setSelectedHotspot] = useState<SafetyMapHotspot | null>(null)
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)

  // The query key rounds bounds to two decimals, so anything finer than that
  // cannot change the result. Comparing on the same rounding keeps a nudge of
  // the map from refetching and remounting everything built from the data.
  const handleBoundsChange = useCallback((next: BoundingBox) => {
    const clamped = clampBounds(next)
    setBounds((current) => (boundsKey(current) === boundsKey(clamped) ? current : clamped))
  }, [])

  const request = useMemo<HotspotsRequest>(() => ({ bounds, timePeriod }), [bounds, timePeriod])
  const hotspotsQuery = useSafetyMapHotspots(request)
  const comparison = useRouteComparison()
  const location = useCurrentLocation()

  const setPoint = useCallback((target: PlannerTarget, point: PlannerPoint) => {
    if (target === 'origin') setOrigin(point)
    else setDestination(point)
  }, [])

  const handleSelectPlace = useCallback(
    (target: PlannerTarget, place: PlaceSuggestion) => {
      setPoint(target, { label: place.name, coordinate: place.coordinate })
    },
    [setPoint],
  )

  const handleClearPoint = useCallback((target: PlannerTarget) => {
    if (target === 'origin') setOrigin(null)
    else setDestination(null)
    setSelectedRouteId(null)
  }, [])

  // Always the starting point: that is what a current position is for.
  const handleUseCurrentLocation = useCallback(async () => {
    const coordinate = await location.request()
    if (!coordinate) return
    setPoint('origin', { label: t('planner.myLocation'), coordinate })
  }, [location, setPoint, t])

  const handleCompare = useCallback(() => {
    if (!origin || !destination) return
    comparison.mutate(
      {
        origin: origin.coordinate,
        destination: destination.coordinate,
        timePeriod,
        travelMode: TRAVEL_MODE,
      },
      { onSuccess: (result) => { setSelectedRouteId(result.recommendedRouteId ?? result.routes[0].id) } },
    )
  }, [comparison, destination, origin, timePeriod])

  const handleSwap = useCallback(() => {
    setOrigin(destination)
    setDestination(origin)
  }, [destination, origin])

  const currentPeriod = useMemo(() => currentTimePeriod(), [])
  const hotspots = hotspotsQuery.data?.hotspots ?? []
  const routes = comparison.data?.routes ?? []
  const windowDays = hotspotsQuery.data?.windowDays ?? 30

  // Following happens along the route the traveller actually chose, and warns
  // about the areas that route passes.
  const selectedRoute = routes.find((route) => route.id === selectedRouteId) ?? null
  const journey = useLiveJourney(
    selectedRoute,
    destination ? { label: destination.label, coordinate: destination.coordinate } : null,
    hotspots,
  )

  return (
    <section aria-label={t('planner.title')} className="flex flex-col gap-6">
      <JourneyPlanner
        origin={origin}
        destination={destination}
        isLocating={location.status === 'loading'}
        isComparing={comparison.isPending}
        onSelectPlace={handleSelectPlace}
        onClearPoint={handleClearPoint}
        onUseCurrentLocation={() => { void handleUseCurrentLocation() }}
        onSwap={handleSwap}
        onCompare={handleCompare}
      />

      {location.status === 'denied' ? <InfoNote text={t('planner.locationDenied')} /> : null}
      {location.status === 'unavailable' ? <InfoNote text={t('planner.locationUnavailable')} /> : null}

      {hotspotsQuery.data ? (
        <p role="status" className="m-0 text-lg font-semibold text-navy">
          {t('weightedIntensity.summary', { reports: hotspots.reduce((sum, area) => sum + area.reportCount, 0), areas: hotspots.length, days: windowDays })}
        </p>
      ) : null}

      <SafetyMapCanvas
        hotspots={hotspots}
        routes={routes}
        selectedRouteId={selectedRouteId}
        origin={journey.position ?? origin?.coordinate ?? null}
        destination={destination?.coordinate ?? null}
        originLabel={journey.position ? t('journey.youAreHere') : origin?.label ?? t('planner.start')}
        destinationLabel={destination?.label ?? t('planner.end')}
        hotspotLabel={(hotspot) => [hotspot.areaName
            ? `${hotspot.areaName} · ${t('map.reportCount', { count: hotspot.reportCount, days: windowDays })}`
            : t('map.reportCount', { count: hotspot.reportCount, days: windowDays }),
          t('weightedIntensity.area', { band: t(`weightedIntensity.${intensityBand(hotspot.intensity)}`) }),
        ].join(' · ')}
        routeLabel={(route) =>
          `${t(`routes.role.${route.role}`)} · ${t('routes.hotspotsPassed', { count: route.hotspotsPassed })}`
        }
        initialBounds={initialBounds}
        onHotspotSelect={setSelectedHotspot}
        onRouteSelect={setSelectedRouteId}
        onBoundsChange={handleBoundsChange}
      />

      {comparison.isError ? <InfoNote tone="error" text={t('routes.loadFailed')} /> : null}

      {comparison.data ? (
        <RouteComparisonCard
          comparison={comparison.data}
          selectedRouteId={selectedRouteId}
          onSelectRoute={setSelectedRouteId}
        />
      ) : null}

      {comparison.data ? (
        <JourneyPanel
          status={journey.status}
          remainingSeconds={journey.remainingSeconds}
          remainingMeters={journey.remainingMeters}
          arrived={journey.arrived}
          insideAreas={journey.insideAreas}
          shareUrl={journey.shareUrl}
          sharing={journey.sharing}
          shareError={journey.shareError}
          canStart={selectedRoute !== null && destination !== null}
          onStart={journey.start}
          onStop={() => { void journey.stop() }}
          onShare={() => { void journey.startSharing() }}
        />
      ) : null}

      <TimePeriodSelector value={timePeriod} currentPeriod={currentPeriod} onChange={setTimePeriod} />

      {hotspotsQuery.isPending ? <Spinner label={t('map.loading')} /> : null}
      {hotspotsQuery.isError ? <InfoNote tone="error" text={t('map.loadFailed')} /> : null}

      {hotspots.length > 0 ? (
        <h2 className="m-0 font-display text-2xl font-semibold text-navy">{t('map.title')}</h2>
      ) : null}

      {hotspots.length > 0 ? (
        <SafetyAreaList
          hotspots={hotspots}
          windowDays={windowDays}
          selectedId={selectedHotspot?.id ?? null}
          onSelect={(hotspot) => {
            setSelectedHotspot((current) => (current?.id === hotspot.id ? null : hotspot))
          }}
        />
      ) : null}

      {hotspotsQuery.data ? <MapEvidenceNotice result={hotspotsQuery.data} /> : null}

      <EstimateLimitsNote />
    </section>
  )
}
