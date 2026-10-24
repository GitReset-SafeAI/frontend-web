import { AlertTriangle, Check, Copy, Flag, Navigation, Share2, Square } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { SafetyMapHotspot } from '../../../services/contracts'
import { Button } from '../../../shared/components/Button'
import { Card } from '../../../shared/components/Card'
import { InfoNote } from '../../../shared/components/InfoNote'

interface JourneyPanelProps {
  status: 'idle' | 'locating' | 'following' | 'denied' | 'unavailable'
  remainingSeconds: number | null
  remainingMeters: number | null
  arrived: boolean
  insideAreas: SafetyMapHotspot[]
  shareUrl: string | null
  sharing: boolean
  shareError: boolean
  canStart: boolean
  onStart: () => void
  onStop: () => void
  onShare: () => void
}

function minutes(seconds: number) {
  return Math.max(1, Math.round(seconds / 60))
}

export function JourneyPanel({
  status,
  remainingSeconds,
  remainingMeters,
  arrived,
  insideAreas,
  shareUrl,
  sharing,
  shareError,
  canStart,
  onStart,
  onStop,
  onShare,
}: JourneyPanelProps) {
  const { t } = useTranslation('safety')
  const [copied, setCopied] = useState(false)
  const walking = status === 'locating' || status === 'following'

  const copy = async () => {
    if (!shareUrl) return
    try {
      // The platform sheet where there is one: it is how people already share
      // a trip. Copying is the fallback, not the other way round.
      if (navigator.share) await navigator.share({ title: t('journey.shareTitle'), url: shareUrl })
      else await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => { setCopied(false) }, 2500)
    } catch {
      // A dismissed share sheet is not an error.
    }
  }

  if (!walking) {
    return (
      <Card className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-mint-light text-navy">
            <Navigation className="size-5" aria-hidden />
          </span>
          <div className="flex flex-col">
            <h2 className="m-0 font-display text-xl font-semibold text-navy">{t('journey.title')}</h2>
            <p className="m-0 text-sm text-ink-muted">{t('journey.subtitle')}</p>
          </div>
        </div>
        {status === 'denied' ? <InfoNote text={t('journey.locationDenied')} /> : null}
        {status === 'unavailable' ? <InfoNote text={t('journey.locationUnavailable')} /> : null}
        <Button icon={<Navigation className="size-5" aria-hidden />} disabled={!canStart} onClick={onStart}>
          {t('journey.start')}
        </Button>
        {!canStart ? <p className="m-0 text-sm text-ink-muted">{t('journey.chooseRouteFirst')}</p> : null}
      </Card>
    )
  }

  return (
    <Card className="flex flex-col gap-4 border-2 border-navy">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {arrived ? t('journey.arrivedLabel') : t('journey.walkingLabel')}
          </span>
          <span className="font-display text-3xl font-semibold text-navy">
            {arrived
              ? t('journey.arrived')
              : remainingSeconds === null
                ? t('journey.locating')
                : t('routes.duration', { minutes: minutes(remainingSeconds) })}
          </span>
          {!arrived && remainingMeters !== null ? (
            <span className="text-sm text-ink-muted">
              {t('journey.remaining', { distance: Math.round(remainingMeters) })}
            </span>
          ) : null}
        </div>
        <span
          aria-hidden
          className={`mt-1 size-3 shrink-0 rounded-full ${status === 'following' ? 'animate-pulse bg-navy' : 'bg-disabled'}`}
        />
      </div>

      {/* The point of walking with the app open: say it while it matters. */}
      {insideAreas.length > 0 ? (
        <div role="status" className="flex items-start gap-3 rounded-lg bg-[#fff3d6] p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
          <div className="flex flex-col gap-1">
            <p className="m-0 font-semibold text-ink">{t('journey.inAreaTitle')}</p>
            <p className="m-0 text-sm text-ink-muted">
              {insideAreas[0].areaName
                ? t('journey.inAreaNamed', { area: insideAreas[0].areaName })
                : t('journey.inArea')}
            </p>
          </div>
        </div>
      ) : null}

      {shareError ? <InfoNote tone="error" text={t('journey.shareFailed')} /> : null}

      {shareUrl ? (
        <div className="flex flex-col gap-2 rounded-lg bg-mint-soft p-4">
          <p className="m-0 flex items-center gap-2 text-sm font-semibold text-ink">
            <Flag className="size-4" aria-hidden />
            {t('journey.sharingOn')}
          </p>
          <p className="m-0 break-all font-mono text-xs text-ink-muted">{shareUrl}</p>
          <Button variant="secondary" icon={copied ? <Check className="size-5" aria-hidden /> : <Copy className="size-5" aria-hidden />} onClick={() => { void copy() }}>
            {copied ? t('journey.shareCopied') : t('journey.shareCopy')}
          </Button>
          <p className="m-0 text-xs text-ink-muted">{t('journey.shareExpiry')}</p>
        </div>
      ) : (
        <Button variant="secondary" icon={<Share2 className="size-5" aria-hidden />} loading={sharing} onClick={onShare}>
          {t('journey.share')}
        </Button>
      )}

      <Button variant="tonal" icon={<Square className="size-5" aria-hidden />} onClick={onStop}>
        {t('journey.stop')}
      </Button>
      <p className="m-0 text-xs text-ink-muted">{t('journey.privacyNote')}</p>
    </Card>
  )
}
