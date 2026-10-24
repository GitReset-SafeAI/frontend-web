import { CheckCircle2, Map, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { Button } from '../../../shared/components/Button'
import { InfoNote } from '../../../shared/components/InfoNote'
import { Card } from '../../../shared/components/Card'
import { StepLayout } from '../../../shared/layouts/StepLayout'
import { EstimateTicket } from '../../incident-ai'
import { useReportDraft } from '../reportDraftContext'

export function ReportSubmittedScreen() {
  const { t } = useTranslation('reporting')
  const { t: tc } = useTranslation()
  const navigate = useNavigate()
  const { receipt, reset } = useReportDraft()

  // Clear the in-memory draft, then go where the user asked.
  const finish = (destination: '/' | '/safety') => {
    reset()
    void navigate(destination)
  }

  return (
    <StepLayout
      title={receipt ? t('submitted.title') : t('submitted.empty')}
      subtitle={receipt ? t('submitted.subtitle') : undefined}
      footer={receipt ? (
        <>
          <Button variant="secondary" icon={<Map className="size-5" aria-hidden />} onClick={() => { finish('/safety') }}>
            {t('submitted.viewMap')}
          </Button>
          <Button onClick={() => { finish('/') }}>{tc('done')}</Button>
        </>
      ) : (
        <Button onClick={() => { void navigate('/report') }}>{t('title')}</Button>
      )}
    >
      {receipt ? (
        <>
          <CheckCircle2 className="size-14 text-success" aria-hidden />
          <p className="m-0 break-all text-sm text-ink-muted">{t('submitted.reference', { id: receipt.report.id })}</p>
          {!receipt.demoAnalysis ? <InfoNote text={t('submitted.saved')} /> : null}

          {receipt.demoAnalysis ? (
            <EstimateTicket words={receipt.report.original_text} analysis={receipt.demoAnalysis} />
          ) : (
            <Card>
              <h2 className="text-lg">{t('submitted.yourWords')}</h2>
              <p className="m-0 whitespace-pre-wrap break-words">{receipt.report.original_text}</p>
            </Card>
          )}
          <InfoNote icon={ShieldCheck} text={t('submitted.next')} />
        </>
      ) : null}
    </StepLayout>
  )
}
