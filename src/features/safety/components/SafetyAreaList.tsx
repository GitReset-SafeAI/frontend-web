import { ChevronDown, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { SafetyMapHotspot } from '../../../services/contracts'
import { confidenceLabelKey, hotspotColor, hotspotIssues, intensityBand } from '../constants/issueTypes'

interface SafetyAreaListProps {
  hotspots: SafetyMapHotspot[]
  windowDays: number
  selectedId: string | null
  onSelect: (hotspot: SafetyMapHotspot) => void
}

// On mobile an area is chosen by tapping the map. Here it can be chosen from the
// map or from this list, which is also the text-only alternative to the map.
// Detail expands in place: a separate card below would repeat the heading.
export function SafetyAreaList({ hotspots, windowDays, selectedId, onSelect }: SafetyAreaListProps) {
  const { t } = useTranslation('safety')

  return (
    <ul aria-label={t('map.title')} className="m-0 flex list-none flex-col gap-3 p-0">
      {hotspots.map((hotspot) => {
        const selected = hotspot.id === selectedId
        const issues = hotspotIssues(hotspot)
        return (
          <li key={hotspot.id}>
            <article
              className={`relative overflow-hidden rounded-lg bg-surface shadow-card transition-colors ${
                selected ? 'border-2 border-navy' : 'border border-line/70'
              }`}
            >
              <span aria-hidden className="absolute inset-y-0 left-0 w-2.5" style={{ backgroundColor: hotspotColor(hotspot.intensity) }} />

              <button
                type="button"
                aria-expanded={selected}
                onClick={() => { onSelect(hotspot) }}
                className="flex w-full items-start justify-between gap-3 p-5 pl-8 text-left hover:bg-mint-soft/60"
              >
                <span className="flex flex-col gap-1">
                  <span className="font-display text-xl font-semibold text-navy">
                    {hotspot.areaName ?? t('map.areaTitle')}
                  </span>
                  <span className="text-lg font-semibold text-ink">
                    {t('map.reportCount', { count: hotspot.reportCount, days: windowDays })}
                  </span>
                  <span className="text-sm text-ink-muted">{t(`evidence.${hotspot.evidenceLevel}`)}</span>
                  <span className="text-sm font-semibold">{t('weightedIntensity.area', { band: t(`weightedIntensity.${intensityBand(hotspot.intensity)}`) })}</span>
                </span>
                <ChevronDown
                  aria-hidden
                  className={`mt-1 size-5 shrink-0 text-ink-muted transition-transform ${selected ? 'rotate-180' : ''}`}
                />
              </button>

              <div className="px-5 pb-5 pl-8">
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                  {issues.map((issue) => (
                    <li
                      key={issue.key}
                      className="inline-flex items-center gap-2 rounded-full bg-mint-soft px-3 py-1 text-sm font-medium text-ink"
                    >
                      <issue.Icon className={`size-4 ${issue.color}`} aria-hidden />
                      {t(issue.labelKey)}
                    </li>
                  ))}
                </ul>

                {selected ? (
                  <dl className="m-0 mt-4 grid gap-x-6 gap-y-2 border-t border-line/70 pt-4 sm:grid-cols-2">
                    <div>
                      <dt className="m-0 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        {t('detail.lastReportLabel')}
                      </dt>
                      <dd className="m-0 text-ink">
                        {t('map.recency', { days: hotspot.mostRecentReportDaysAgo })}
                      </dd>
                    </div>
                    {hotspot.peakTimePeriod ? (
                      <div>
                        <dt className="m-0 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                          {t('timePeriod.label')}
                        </dt>
                        <dd className="m-0 text-ink">
                          {t('map.peakTime', { bucket: t(`timePeriod.${hotspot.peakTimePeriod}`) })}
                        </dd>
                      </div>
                    ) : null}
                    <div className="sm:col-span-2">
                      <dt className="m-0 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        {t('detail.confidenceLabel')}
                      </dt>
                      <dd className="m-0 text-ink">{t(confidenceLabelKey(hotspot.meanConfidence))}</dd>
                    </div>
                  </dl>
                ) : null}

                {/* A single area must never read as fact, selected or not. */}
                <p className="m-0 mt-3 flex items-start gap-2 text-sm text-ink-muted">
                  <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {t('map.areaApproximate')}
                </p>
              </div>
            </article>
          </li>
        )
      })}
    </ul>
  )
}
