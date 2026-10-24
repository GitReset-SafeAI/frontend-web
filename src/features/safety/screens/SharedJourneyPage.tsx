import { useQuery } from '@tanstack/react-query'
import { Flag, MapPinned } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { services } from '../../../services'
import { InfoNote } from '../../../shared/components/InfoNote'
import { Spinner } from '../../../shared/components/Spinner'
import { SharedJourneyMap } from '../components/SharedJourneyMap'

// What someone sees when a traveller shares their walk. Read only: the link
// shows where they are and the path they chose, and nothing else about them.
// It stops working when they arrive, end the journey, or it expires.
export function SharedJourneyPage() {
  const { t } = useTranslation('safety')
  const { shareId = '' } = useParams()

  const journey = useQuery({
    queryKey: ['shared-journey', shareId],
    queryFn: () => services.journeys.read(shareId),
    // Following someone means asking often; this is the only page that polls.
    refetchInterval: 5000,
    retry: false,
  })

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-4">
        <h1 className="display-lg">{t('journey.sharedTitle')}</h1>

        {journey.isPending ? <Spinner label={t('journey.sharedLoading')} /> : null}

        {journey.isError ? (
          <InfoNote tone="error" text={t('journey.sharedUnavailable')} />
        ) : null}

        {journey.data ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-mint-light px-4 py-1.5 text-sm font-semibold text-navy">
                <MapPinned className="size-4" aria-hidden />
                {journey.data.destinationLabel || t('planner.end')}
              </span>
              <span
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ${
                  journey.data.status === 'arrived' ? 'bg-mint text-navy' : 'bg-navy text-white'
                }`}
              >
                <Flag className="size-4" aria-hidden />
                {t(journey.data.status === 'arrived' ? 'journey.arrived' : 'journey.walkingLabel')}
              </span>
            </div>

            <SharedJourneyMap journey={journey.data} />

            {journey.data.position === null ? (
              <p className="m-0 text-ink-muted">{t('journey.sharedNoFixYet')}</p>
            ) : journey.data.accuracyMeters !== null ? (
              <p className="m-0 text-sm text-ink-muted">
                {t('journey.sharedAccuracy', { metres: Math.round(journey.data.accuracyMeters) })}
              </p>
            ) : null}

            <p className="m-0 text-sm text-ink-muted">{t('journey.sharedCaveat')}</p>
          </>
        ) : null}
      </div>
    </div>
  )
}
