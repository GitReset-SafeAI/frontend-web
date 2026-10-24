import { Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { HotspotsResult } from '../../../services/contracts'
import { Card } from '../../../shared/components/Card'

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
      {result.suppressedAreaCount > 0 ? (
        <p className="m-0 text-sm text-ink-muted">
          {t('map.suppressed', { count: result.suppressedAreaCount })}
        </p>
      ) : null}
      <p className="m-0 text-sm text-ink-muted">{t('map.disclaimer')}</p>
    </Card>
  )
}
