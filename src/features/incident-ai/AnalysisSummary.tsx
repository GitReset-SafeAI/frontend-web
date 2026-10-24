import { Bot } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Card } from '../../shared/components/Card'
import { InfoNote } from '../../shared/components/InfoNote'
import type { IncidentAnalysis, SeverityLevel } from '../../services/contracts'
import { useIncidentLabels } from './useIncidentLabels'

const severityBars: Record<SeverityLevel, number> = { low: 1, moderate: 2, high: 3, unknown: 0 }

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="m-0 text-sm font-semibold text-ink-muted">{label}</p>
      {children}
    </div>
  )
}

// The AI's interpretation, presented as an estimate and visibly separate from the user's own words.
export function AnalysisSummary({ analysis }: { analysis: IncidentAnalysis }) {
  const { t } = useTranslation('incidentAi')
  const { categoryLabel } = useIncidentLabels()
  const bars = severityBars[analysis.severity]
  const severityLabel = t(`severityLevels.${analysis.severity}`)

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Bot className="size-6 text-primary-dark" aria-hidden />
        <h2 className="text-xl font-semibold">{t('title')}</h2>
      </div>
      <InfoNote text={t('estimateNote')} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Row label={t('category')}>
          <p className="m-0 text-lg font-semibold">{categoryLabel(analysis.category)}</p>
          <p className="m-0 text-sm text-ink-muted">
            {t('confidence', { level: t(`confidenceLevels.${analysis.confidence}`) })}
          </p>
        </Row>

        <Row label={t('severity')}>
          <div className="flex items-center gap-3">
            <div className="flex gap-1" role="img" aria-label={severityLabel}>
              {[1, 2, 3].map((level) => (
                <span key={level} className={`h-2.5 w-6 rounded-full ${level <= bars ? 'bg-primary-dark' : 'bg-line'}`} />
              ))}
            </div>
            <p className="m-0 text-lg font-semibold">{severityLabel}</p>
          </div>
          {analysis.severity === 'unknown' ? (
            <p className="m-0 text-sm text-ink-muted">{t('severityUnknown')}</p>
          ) : null}
        </Row>
      </div>

      <Row label={t('picked')}>
        {analysis.extractedDetails.length === 0 ? (
          <p className="m-0 text-sm text-ink-muted">{t('none')}</p>
        ) : analysis.extractedDetails.map((detail) => (
          <p key={`${detail.kind}-${detail.value}`} className="m-0">
            {t(`detailKinds.${detail.kind}`)}: {detail.value}
          </p>
        ))}
      </Row>

      {analysis.missingInformation.length > 0 ? (
        <Row label={t('missing')}>
          <ul className="m-0 list-disc pl-6">
            {analysis.missingInformation.map((kind) => <li key={kind}>{t(`missingKinds.${kind}`)}</li>)}
          </ul>
        </Row>
      ) : null}
    </Card>
  )
}
