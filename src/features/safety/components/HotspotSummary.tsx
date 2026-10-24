import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { Hotspot } from '../../../services/contracts'
import { Card } from '../../../shared/components/Card'
import { InfoNote } from '../../../shared/components/InfoNote'
import { useIncidentLabels } from '../../incident-ai'
import { ActivityBadge } from './ActivityBadge'

interface HotspotSummaryProps {
  hotspot: Hotspot
  selected?: boolean
  onSelect?: () => void
  onClose?: () => void
}

// One privacy-protected area: counts and categories only, never descriptions or exact positions.
// Every summary carries its own limits, because a count is not a verdict on an area.
export function HotspotSummary({ hotspot, selected = false, onSelect, onClose }: HotspotSummaryProps) {
  const { t } = useTranslation('safety')
  const { categoryLabel } = useIncidentLabels()
  const topCategories = [...hotspot.categoryCounts].sort((a, b) => b.count - a.count).slice(0, 3)

  return (
    <Card className={`flex flex-col gap-3 ${selected ? 'border-2 border-primary-dark' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold">{hotspot.areaName}</h3>
        <div className="flex shrink-0 items-center gap-1">
          {onSelect ? (
            <button
              type="button"
              aria-pressed={selected}
              onClick={onSelect}
              className="min-h-12 rounded-sm px-3 text-sm font-semibold text-primary-dark hover:bg-tint-soft"
            >
              {selected ? t('detail.selected') : t('detail.show')}
            </button>
          ) : null}
          {onClose ? (
            <button
              type="button"
              aria-label={t('detail.close')}
              onClick={onClose}
              className="grid size-12 place-items-center rounded-full text-ink hover:bg-tint-soft"
            >
              <X className="size-6" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      <ActivityBadge activity={hotspot.activity} />
      <p className="m-0">{t('detail.reports', { count: hotspot.reportCount, days: hotspot.windowDays })}</p>
      <p className="m-0 text-sm text-ink-muted">
        {hotspot.lastReportDaysAgo === 0
          ? t('detail.lastReportToday')
          : t('detail.lastReport', { count: hotspot.lastReportDaysAgo })}
        {' · '}
        {t('detail.confidence', { level: t(`detail.confidenceLevels.${hotspot.dataConfidence}`) })}
      </p>

      <div>
        <p className="m-0 text-sm font-semibold text-ink-muted">{t('detail.topCategories')}</p>
        <ul className="m-0 list-none p-0">
          {topCategories.map((entry) => (
            <li key={entry.category} className="text-[0.9375rem]">{categoryLabel(entry.category)} · {entry.count}</li>
          ))}
        </ul>
      </div>

      <InfoNote text={hotspot.activity === 'insufficient' ? t('detail.caveatInsufficient') : t('detail.caveat')} />
    </Card>
  )
}
