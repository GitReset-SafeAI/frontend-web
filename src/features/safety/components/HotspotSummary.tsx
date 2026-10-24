import { Info, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { Hotspot } from '../../../services/contracts'
import { useIncidentLabels } from '../../incident-ai'
import { ActivityBadge } from './ActivityBadge'
import { swatchColor } from './activityStyles'

interface HotspotSummaryProps {
  hotspot: Hotspot
  selected?: boolean
  onSelect?: () => void
  onClose?: () => void
}

// One privacy-protected area: counts and categories only, never descriptions or exact positions.
// The coloured band repeats the activity level, but the words always carry the meaning.
// Every summary carries its own limits, because a count is not a verdict on an area.
export function HotspotSummary({ hotspot, selected = false, onSelect, onClose }: HotspotSummaryProps) {
  const { t } = useTranslation('safety')
  const { categoryLabel } = useIncidentLabels()
  const topCategories = [...hotspot.categoryCounts].sort((a, b) => b.count - a.count).slice(0, 3)

  return (
    <article
      className={`relative overflow-hidden rounded-lg border bg-surface p-5 pl-8 shadow-card ${
        selected ? 'border-2 border-navy' : 'border-line/70'
      }`}
    >
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 w-2.5 ${swatchColor[hotspot.activity]} ${
          hotspot.activity === 'insufficient' ? 'border-r-2 border-dashed border-ink-muted' : ''
        }`}
      />

      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-xl font-semibold">{hotspot.areaName}</h3>
        <div className="flex shrink-0 items-center gap-1">
          {onSelect ? (
            <button
              type="button"
              aria-pressed={selected}
              onClick={onSelect}
              className="min-h-11 rounded-full px-4 text-sm font-semibold text-navy hover:bg-mint-soft"
            >
              {selected ? t('detail.selected') : t('detail.show')}
            </button>
          ) : null}
          {onClose ? (
            <button
              type="button"
              aria-label={t('detail.close')}
              onClick={onClose}
              className="grid size-11 place-items-center rounded-full text-ink hover:bg-mint-soft"
            >
              <X className="size-5" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-1">
        <ActivityBadge activity={hotspot.activity} />
        <p className="m-0 text-lg font-semibold">{t('detail.reports', { count: hotspot.reportCount, days: hotspot.windowDays })}</p>
        <p className="m-0 text-sm text-ink-muted">
          {hotspot.lastReportDaysAgo === 0
            ? t('detail.lastReportToday')
            : t('detail.lastReport', { count: hotspot.lastReportDaysAgo })}
          {' · '}
          {t('detail.confidence', { level: t(`detail.confidenceLevels.${hotspot.dataConfidence}`) })}
        </p>
      </div>

      <div className="mt-4">
        <p className="m-0 text-sm font-semibold text-ink-muted">{t('detail.topCategories')}</p>
        <ul className="m-0 mt-1.5 flex list-none flex-wrap gap-2 p-0">
          {topCategories.map((entry) => (
            <li key={entry.category} className="inline-flex items-center gap-2 rounded-full bg-mint-soft py-1 pl-3 pr-1 text-sm font-medium">
              {categoryLabel(entry.category)}
              <span className="grid min-w-6 place-items-center rounded-full bg-navy px-1.5 text-xs font-bold leading-6 text-white">{entry.count}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="m-0 mt-4 flex items-start gap-2 text-sm text-ink-muted">
        <Info className="mt-1 size-4 shrink-0" aria-hidden />
        {hotspot.activity === 'insufficient' ? t('detail.caveatInsufficient') : t('detail.caveat')}
      </p>
    </article>
  )
}
