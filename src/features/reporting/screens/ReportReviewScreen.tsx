import { Bot, Lock, Timer } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'

import { reportSubmissionSchema } from '../../../services/contracts/incident'
import { Button } from '../../../shared/components/Button'
import { Card } from '../../../shared/components/Card'
import { InfoNote } from '../../../shared/components/InfoNote'
import { StepLayout } from '../../../shared/layouts/StepLayout'
import { useSubmitReport } from '../hooks/useSubmitReport'
import { toSubmission, useReportDraft } from '../reportDraftContext'

function SummarySection({ title, editLabel, onEdit, lines }: {
  title: string
  editLabel: string
  onEdit: () => void
  lines: string[]
}) {
  return (
    <Card className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button variant="text" className="min-h-12" aria-label={`${editLabel}: ${title}`} onClick={onEdit}>{editLabel}</Button>
      </div>
      {lines.map((line) => <p key={line} className="m-0 whitespace-pre-wrap break-words">{line}</p>)}
    </Card>
  )
}

export function ReportReviewScreen() {
  const { t } = useTranslation('reporting')
  const { t: tc } = useTranslation()
  const navigate = useNavigate()
  const { draft, receipt, setReceipt } = useReportDraft()
  const submit = useSubmitReport()
  const parsed = reportSubmissionSchema.safeParse(toSubmission(draft))
  const notProvided = t('review.notProvided')

  // A report that was already received can never be submitted a second time from this form.
  if (receipt) return <Navigate to="/report/submitted" replace />

  const whenWhere = [
    draft.occurredWhen ? t(`when.options.${draft.occurredWhen}`) : undefined,
    draft.location
      ? (draft.location.source === 'device' || !draft.location.districtId
        ? t('when.selectedCurrent')
        : t('when.selectedDistrict', { district: t(`districts.${draft.location.districtId}`) }))
      : undefined,
  ].filter((line): line is string => Boolean(line))

  const extra = [
    draft.lighting ? `${t('details.lighting')}: ${t(`details.lightingOptions.${draft.lighting}`)}` : undefined,
    draft.crowd ? `${t('details.crowd')} ${t(`details.crowdOptions.${draft.crowd}`)}` : undefined,
    draft.othersNearby ? `${t('details.others')} ${t(`details.othersOptions.${draft.othersNearby}`)}` : undefined,
  ].filter((line): line is string => Boolean(line))

  const onSubmit = () => {
    if (!parsed.success) return
    submit.mutate(parsed.data, {
      onSuccess: (result) => {
        setReceipt(result)
        // Replace this entry so Back can never return to the form and resubmit the same report.
        void navigate('/report/submitted', { replace: true })
      },
    })
  }

  return (
    <StepLayout
      title={t('review.title')}
      subtitle={t('review.subtitle')}
      footer={(
        <>
          <Button variant="secondary" disabled={submit.isPending} onClick={() => { void navigate('/report/details') }}>
            {tc('back')}
          </Button>
          <Button loading={submit.isPending} disabled={!parsed.success} onClick={onSubmit}>
            {t('review.submit')}
          </Button>
        </>
      )}
    >
      {!parsed.success ? <InfoNote tone="error" text={t('review.invalid')} /> : null}
      {submit.isError ? <InfoNote tone="error" text={`${t('review.errorTitle')}. ${t('review.errorBody')}`} /> : null}
      {submit.isPending ? (
        <div role="status"><InfoNote icon={Timer} text={t('review.submitting')} /></div>
      ) : null}

      <SummarySection title={t('review.what')} editLabel={tc('edit')} onEdit={() => { void navigate('/report') }} lines={[draft.description.trim() || notProvided]} />
      <SummarySection title={t('review.whenWhere')} editLabel={tc('edit')} onEdit={() => { void navigate('/report/when') }} lines={whenWhere.length ? whenWhere : [notProvided]} />
      <SummarySection title={t('review.extra')} editLabel={tc('edit')} onEdit={() => { void navigate('/report/details') }} lines={extra.length ? extra : [notProvided]} />

      <div className="flex flex-col gap-3">
        <InfoNote icon={Lock} text={t('review.privacy')} />
        <InfoNote icon={Bot} text={t('review.aiNote')} />
      </div>
    </StepLayout>
  )
}
