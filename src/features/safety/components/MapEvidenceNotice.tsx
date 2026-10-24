import { Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { HotspotsResult } from '../../../services/contracts'
import { Card } from '../../../shared/components/Card'
import { hotspotColor, intensityBands } from '../constants/issueTypes'

interface MapEvidenceNoticeProps {
  result: HotspotsResult
}

// Absence of hotspots must never read as "this area is safe", so the empty
// state is stated explicitly rather than left to an empty map.
export function MapEvidenceNotice({ result }: MapEvidenceNoticeProps) {
  const { t } = useTranslation('safety')
  const isEmpty = result.hotspots.length === 0

  return (
    <Card data-testid="evidence-card" className="flex flex-col gap-2">
      <div className="flex items-start gap-3">
        <Info className="mt-0.5 size-5 shrink-0 text-navy" aria-hidden />
        <h2 className="m-0 font-sans text-base font-semibold tracking-normal text-ink">
          {t(isEmpty ? 'map.emptyTitle' : 'map.legendTitle')}
        </h2>
      </div>
      <p className="m-0 text-sm text-ink-muted">
        {t(isEmpty ? 'map.emptyDescription' : 'map.legendDescription')}
      </p>
      <p className="m-0 text-sm text-ink-muted">{t(`evidence.${result.evidenceLevel}`)}</p>
      {!isEmpty ? (
        <div className="flex flex-col gap-3 border-t border-line/70 pt-3">
          <h3 className="m-0 text-base font-semibold">{t('weightedIntensity.title')}</h3>
          <ul className="m-0 flex list-none flex-wrap gap-4 p-0 text-sm">
            {intensityBands.map((band, index) => (
              <li key={band} className="inline-flex items-center gap-2">
                <span aria-hidden className="size-4 rounded-sm" style={{ backgroundColor: hotspotColor(index / 4) }} />
                {t(`weightedIntensity.${band}`)}
              </li>
            ))}
          </ul>
          <p className="m-0 text-sm text-ink-muted">{t('weightedIntensity.explanation')}</p>
        </div>
      ) : null}
      {result.suppressedAreaCount > 0 ? (
        <p className="m-0 text-sm text-ink-muted">
          {t('map.suppressed', { count: result.suppressedAreaCount })}
        </p>
      ) : null}
      <p className="m-0 text-sm text-ink-muted">{t('map.disclaimer')}</p>
    </Card>
  )
}
