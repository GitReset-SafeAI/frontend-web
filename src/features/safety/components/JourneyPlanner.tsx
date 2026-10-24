import { ArrowUpDown, CircleDot, Crosshair, MapPinCheck, Navigation } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { PlaceSuggestion } from '../../../services/contracts'
import { Button } from '../../../shared/components/Button'
import { Card } from '../../../shared/components/Card'
import { PlaceSearchField } from './PlaceSearchField'

export type PlannerTarget = 'origin' | 'destination'

export interface PlannerPoint {
  label: string
  coordinate: { latitude: number; longitude: number }
}

interface JourneyPlannerProps {
  origin: PlannerPoint | null
  destination: PlannerPoint | null
  isLocating: boolean
  isComparing: boolean
  onSelectPlace: (target: PlannerTarget, place: PlaceSuggestion) => void
  onClearPoint: (target: PlannerTarget) => void
  onFocusField: (target: PlannerTarget) => void
  onUseCurrentLocation: () => void
  onSwap: () => void
  onCompare: () => void
}

export function JourneyPlanner({
  origin,
  destination,
  isLocating,
  isComparing,
  onSelectPlace,
  onClearPoint,
  onFocusField,
  onUseCurrentLocation,
  onSwap,
  onCompare,
}: JourneyPlannerProps) {
  const { t } = useTranslation('safety')

  return (
    <Card data-testid="planner-card" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="m-0 font-display text-xl font-semibold text-navy">{t('planner.title')}</h2>
        <p className="m-0 text-sm text-ink-muted">{t('planner.subtitle')}</p>
      </div>

      {/* Full width: the inputs hold place names, which are long. */}
      <div className="flex flex-col gap-3">
        <PlaceSearchField
          label={t('planner.start')}
          Icon={CircleDot}
          testId="planner-origin"
          value={origin?.label ?? ''}
          placeholder={t('planner.searchPlaceholder')}
          onSelect={(place) => { onSelectPlace('origin', place) }}
          onClear={() => { onClearPoint('origin') }}
          onFocus={() => { onFocusField('origin') }}
        />
        <PlaceSearchField
          label={t('planner.end')}
          Icon={MapPinCheck}
          testId="planner-destination"
          value={destination?.label ?? ''}
          placeholder={t('planner.searchPlaceholder')}
          onSelect={(place) => { onSelectPlace('destination', place) }}
          onClear={() => { onClearPoint('destination') }}
          onFocus={() => { onFocusField('destination') }}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="text"
          icon={<Crosshair className="size-5" aria-hidden />}
          loading={isLocating}
          onClick={onUseCurrentLocation}
        >
          {t('planner.useMyLocation')}
        </Button>
        <button
          type="button"
          aria-label={t('planner.swap')}
          disabled={!origin && !destination}
          onClick={onSwap}
          className="grid size-12 shrink-0 place-items-center rounded-full border border-ink-muted/60 text-navy transition-colors hover:bg-mint-soft disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ArrowUpDown className="size-5" aria-hidden />
        </button>
      </div>

      <p className="m-0 text-sm text-ink-muted">{t('planner.hint')}</p>

      <Button
        icon={<Navigation className="size-5" aria-hidden />}
        loading={isComparing}
        disabled={!origin || !destination || isComparing}
        onClick={onCompare}
      >
        {t('planner.compare')}
      </Button>
    </Card>
  )
}
