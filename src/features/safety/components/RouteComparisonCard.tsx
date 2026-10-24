import { Car, ChartLine, Info, PersonStanding, Shield, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { Route, RouteComparisonResult } from '../../../services/contracts'
import { Card } from '../../../shared/components/Card'
import { routeIssues } from '../constants/issueTypes'

interface RouteComparisonCardProps {
  comparison: RouteComparisonResult
  selectedRouteId: string | null
  onSelectRoute: (routeId: string) => void
}

function minutes(seconds: number) {
  return Math.max(1, Math.round(seconds / 60))
}

export function RouteComparisonCard({
  comparison,
  selectedRouteId,
  onSelectRoute,
}: RouteComparisonCardProps) {
  const { t } = useTranslation('safety')
  const ModeIcon = comparison.travelMode === 'driving' ? Car : PersonStanding

  // The backend returns no recommendation for two unrelated reasons: no
  // alternative was worth the detour, or there was nothing to detour around at
  // all. Telling them apart matters, because "no clearly better route" reads as
  // a warning when in fact nothing was reported on any of these routes.
  const quickest = comparison.routes.reduce(
    (best, route) => (route.durationSeconds < best.durationSeconds ? route : best),
    comparison.routes[0],
  )
  const nothingToAvoid = quickest.hotspotsPassed === 0

  // Three different situations arrive as the same null recommendation, and
  // they need different answers:
  //   nothing was reported on any of these routes
  //   every route passes one, and the search for a way around found nothing
  //   a detour exists but was not worth the extra time
  const notice = nothingToAvoid
    ? 'nothingToAvoid'
    : comparison.clearRouteId === null
      ? 'noClearRoute'
      : 'noAlternative'

  return (
    <Card data-testid="routes-card" className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-mint-light text-navy">
          <ModeIcon className="size-5" aria-hidden />
        </span>
        <div className="flex flex-col">
          <h2 className="m-0 font-display text-xl font-semibold text-navy">{t('routes.title')}</h2>
          <p className="m-0 text-sm text-ink-muted">{t(`planner.${comparison.travelMode}`)}</p>
        </div>
      </div>

      {/* An area around an endpoint cannot be routed away from, so say so
          rather than leaving every route looking unavoidably exposed. */}
      {comparison.originInReportedArea ? (
        <p className="m-0 text-sm text-ink-muted">{t('routes.originInArea')}</p>
      ) : null}
      {comparison.destinationInReportedArea ? (
        <p className="m-0 text-sm text-ink-muted">{t('routes.destinationInArea')}</p>
      ) : null}

      {comparison.recommendedRouteId === null ? (
        <div className="flex items-start gap-3 rounded-lg bg-mint-soft p-4">
          <Info className="mt-0.5 size-5 shrink-0 text-info" aria-hidden />
          <div className="flex flex-col gap-1">
            <p className="m-0 font-semibold text-ink">{t(`routes.${notice}Title`)}</p>
            <p className="m-0 text-sm text-ink-muted">{t(`routes.${notice}Description`)}</p>
          </div>
        </div>
      ) : null}

      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {comparison.routes.map((route) => (
          <li key={route.id}>
            <RouteRow
              route={route}
              selected={route.id === selectedRouteId}
              recommended={route.id === comparison.recommendedRouteId}
              // Marked even without a recommendation, so there is always a
              // route to act on rather than only "nothing qualified".
              lowestExposure={
                comparison.recommendedRouteId === null &&
                comparison.clearRouteId === null &&
                route.id === comparison.lowestExposureRouteId &&
                comparison.routes.length > 1 &&
                // "Fewest of these" says nothing when every route passes none.
                !nothingToAvoid
              }
              // A route through nothing at all, however long it takes.
              clear={route.id === comparison.clearRouteId}
              onSelect={() => { onSelectRoute(route.id) }}
            />
          </li>
        ))}
      </ul>

      {/* The routing service has no pedestrian profile, so a walking path
          follows the road network. Said plainly. */}
      {comparison.usesStreetNetwork && !comparison.pedestrianProfileAvailable
      && comparison.travelMode === 'walking' ? (
        <p className="m-0 text-sm text-ink-muted">{t('routes.roadNetworkWalking')}</p>
      ) : null}

      {comparison.usesStreetNetwork ? null : (
        <p className="m-0 text-sm text-ink-muted">{t('routes.approximateGeometry')}</p>
      )}

      <p className="m-0 text-sm text-ink-muted">{t('routes.disclaimer')}</p>
    </Card>
  )
}

interface RouteRowProps {
  route: Route
  selected: boolean
  recommended: boolean
  lowestExposure: boolean
  clear: boolean
  onSelect: () => void
}

function Tag({ Icon, children, accent = false }: { Icon: typeof Shield; children: string; accent?: boolean }) {
  // Coral is the warm accent and always carries navy text; mint is the calm
  // supporting surface for everything else.
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-navy ${
        accent ? 'bg-coral' : 'bg-mint-light'
      }`}
    >
      <Icon className="size-4" aria-hidden />
      {children}
    </span>
  )
}

function RouteRow({ route, selected, recommended, lowestExposure, clear, onSelect }: RouteRowProps) {
  const { t } = useTranslation('safety')
  const label = t(`routes.role.${route.role}`)
  const issues = routeIssues(route)

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${label}. ${t('routes.duration', { minutes: minutes(route.durationSeconds) })}`}
      onClick={onSelect}
      className={`flex w-full flex-col gap-1.5 rounded-md p-4 text-left transition-colors hover:bg-mint-soft ${
        selected ? 'border-2 border-navy bg-mint-soft' : 'border border-line/70 bg-surface'
      }`}
    >
      <span className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</span>
        {/* The recommendation is stated in words, never by colour alone. */}
        {recommended ? <Tag Icon={ShieldCheck} accent>{t('routes.recommended')}</Tag> : null}
        {lowestExposure ? <Tag Icon={ChartLine}>{t('routes.lowestExposure')}</Tag> : null}
        {clear && !recommended ? <Tag Icon={Shield}>{t('routes.clearRoute')}</Tag> : null}
      </span>

      <span className="flex items-baseline gap-2">
        <span className="font-display text-2xl font-semibold text-navy">
          {t('routes.duration', { minutes: minutes(route.durationSeconds) })}
        </span>
        {route.extraDurationSeconds > 0 ? (
          <span className="text-sm font-medium text-ink-muted">
            {t('routes.extraTime', { minutes: minutes(route.extraDurationSeconds) })}
          </span>
        ) : null}
      </span>

      <span className="text-sm text-ink-muted">
        {t('routes.hotspotsPassed', { count: route.hotspotsPassed })}
      </span>

      {clear ? (
        <span className="text-sm text-ink-muted">{t('routes.clearRouteNote')}</span>
      ) : null}

      {issues.length > 0 ? (
        <span className="mt-1 flex flex-wrap gap-2">
          {issues.map((issue) => (
            <span
              key={issue.key}
              className="inline-flex items-center gap-1.5 rounded-full bg-screen px-3 py-1 text-xs font-medium text-ink"
            >
              <issue.Icon className={`size-4 ${issue.color}`} aria-hidden />
              {t(issue.labelKey)}
            </span>
          ))}
        </span>
      ) : (
        <span className="text-sm text-ink-muted">{t('routes.noReportedIssues')}</span>
      )}
    </button>
  )
}
