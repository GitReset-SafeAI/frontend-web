import { Bot, CircleHelp, Info, Quote } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { IncidentAnalysis, SeverityLevel } from '../../services/contracts'
import { useIncidentLabels } from './useIncidentLabels'

const severityBars: Record<SeverityLevel, number> = { low: 1, moderate: 2, high: 3, unknown: 0 }

interface EstimateTicketProps {
  // The user's own words. Always shown first and always kept separate from the AI's reading.
  words: string
  analysis: IncidentAnalysis
}

// The report as a ticket: your words on top, a perforated tear, then the AI's interpretation below,
// stamped as an estimate. The layout itself says "these are two different things".
export function EstimateTicket({ words, analysis }: EstimateTicketProps) {
  const { t } = useTranslation('incidentAi')
  const { t: tw } = useTranslation('web')
  const { t: tr } = useTranslation('reporting')
  const { categoryLabel } = useIncidentLabels()
  const bars = severityBars[analysis.severity]
  const severityLabel = t(`severityLevels.${analysis.severity}`)

  return (
    <div className="ticket">
      <section className="ticket-top relative rounded-t-lg border-b-2 border-dashed border-line bg-surface px-6 pb-7 pt-6">
        <p className="m-0 text-sm font-semibold text-ink-muted">{tr('submitted.yourWords')}</p>
        <div className="mt-2 flex gap-3">
          <Quote className="mt-1 size-6 shrink-0 text-coral" aria-hidden />
          <p className="m-0 whitespace-pre-wrap break-words font-display text-xl leading-snug text-navy">{words}</p>
        </div>
      </section>

      <section className="ticket-bottom relative rounded-b-lg bg-mint-soft px-6 pb-6 pt-7">
        <div className="flex items-start justify-between gap-3">
          <h2 className="flex items-center gap-2 font-sans text-base font-bold tracking-normal">
            <Bot className="size-5 shrink-0" aria-hidden />
            {t('title')}
          </h2>
          {/* Decorative restatement of the estimate note below. */}
          <span
            aria-hidden
            className="-mt-1 shrink-0 -rotate-6 rounded-md border-2 border-coral bg-surface/70 px-2 py-0.5 text-[0.6875rem] font-extrabold uppercase tracking-widest text-navy"
          >
            {tw('landing.stamp')}
          </span>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <p className="m-0 text-sm font-semibold text-ink-muted">{t('category')}</p>
            <p className="m-0 font-display text-2xl font-semibold leading-tight text-navy">{categoryLabel(analysis.category)}</p>
            <p className="m-0 mt-1 text-sm text-ink-muted">{t('confidence', { level: t(`confidenceLevels.${analysis.confidence}`) })}</p>
          </div>

          <div>
            <p className="m-0 text-sm font-semibold text-ink-muted">{t('severity')}</p>
            <div className="mt-1 flex items-center gap-3">
              <div className="flex gap-1" role="img" aria-label={severityLabel}>
                {[1, 2, 3].map((level) => (
                  <span key={level} className={`h-3 w-7 rounded-full ${level <= bars ? 'bg-navy' : 'bg-line'}`} />
                ))}
              </div>
              <p className="m-0 text-lg font-semibold">{severityLabel}</p>
            </div>
            {analysis.severity === 'unknown' ? <p className="m-0 mt-1 text-sm text-ink-muted">{t('severityUnknown')}</p> : null}
          </div>
        </div>

        <div className="mt-5">
          <p className="m-0 text-sm font-semibold text-ink-muted">{t('picked')}</p>
          {analysis.extractedDetails.length === 0 ? (
            <p className="m-0 text-sm text-ink-muted">{t('none')}</p>
          ) : (
            <ul className="m-0 mt-1.5 flex list-none flex-wrap gap-2 p-0">
              {analysis.extractedDetails.map((detail) => (
                <li key={`${detail.kind}-${detail.value}`} className="rounded-full border border-line bg-surface px-3 py-1 text-sm font-medium">
                  {t(`detailKinds.${detail.kind}`)}: {detail.value}
                </li>
              ))}
            </ul>
          )}
        </div>

        {analysis.missingInformation.length > 0 ? (
          <div className="mt-4">
            <p className="m-0 text-sm font-semibold text-ink-muted">{t('missing')}</p>
            <ul className="m-0 mt-1.5 flex list-none flex-wrap gap-2 p-0">
              {analysis.missingInformation.map((kind) => (
                <li key={kind} className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-ink-muted px-3 py-1 text-sm">
                  <CircleHelp className="size-4 text-ink-muted" aria-hidden />
                  {t(`missingKinds.${kind}`)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="m-0 mt-5 flex items-start gap-2 text-sm text-ink-muted">
          <Info className="mt-1 size-4 shrink-0" aria-hidden />
          {t('estimateNote')}
        </p>
      </section>
    </div>
  )
}
