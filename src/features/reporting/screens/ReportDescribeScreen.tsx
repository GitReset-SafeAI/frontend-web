import { Check, Mic, RotateCcw, TextCursorInput } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { DESCRIPTION_MAX_LENGTH, DESCRIPTION_MIN_LENGTH } from '../../../services/contracts/incident'
import { Button } from '../../../shared/components/Button'
import { InfoNote } from '../../../shared/components/InfoNote'
import { StepLayout } from '../../../shared/layouts/StepLayout'
import { VoiceInputDialog } from '../components/VoiceInputDialog'
import { useReportDraft } from '../reportDraftContext'

export function ReportDescribeScreen() {
  const { t } = useTranslation('reporting')
  const { t: tc } = useTranslation()
  const navigate = useNavigate()
  const { draft, update, receipt, reset } = useReportDraft()
  const [attempted, setAttempted] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const errorId = useId()

  // Opening a fresh form after a submitted report starts a new draft, so the old receipt never lingers.
  useEffect(() => { if (receipt) reset() }, [receipt, reset])

  const tooShort = draft.description.trim().length < DESCRIPTION_MIN_LENGTH
  const showLengthError = attempted && tooShort
  const showTranscriptError = attempted && draft.transcriptPending

  const onNext = () => {
    setAttempted(true)
    if (tooShort || draft.transcriptPending) return
    void navigate('/report/when')
  }

  const onTranscript = (text: string) => {
    const existing = draft.description.trim()
    update({
      description: existing ? `${existing} ${text}` : text,
      inputMethod: 'voice',
      transcriptPending: true,
    })
    setVoiceOpen(false)
  }

  return (
    <StepLayout
      step={{ current: 1, total: 3 }}
      title={t('describe.title')}
      subtitle={t('describe.subtitle')}
      footer={<Button onClick={onNext}>{tc('next')}</Button>}
    >
      <div className="flex flex-col gap-1">
        <textarea
          value={draft.description}
          onChange={(event) => { update({ description: event.target.value }) }}
          placeholder={t('describe.placeholder')}
          aria-label={t('describe.a11yLabel')}
          aria-invalid={showLengthError}
          aria-describedby={showLengthError ? errorId : undefined}
          maxLength={DESCRIPTION_MAX_LENGTH}
          rows={8}
          className={`min-h-48 w-full resize-y rounded-sm border bg-surface p-4 text-base text-ink placeholder:text-ink-muted ${
            showLengthError ? 'border-2 border-danger' : 'border-ink-muted'
          }`}
        />
        <div className="flex items-start justify-between gap-4">
          {showLengthError ? (
            <p id={errorId} role="alert" className="m-0 text-sm font-medium text-danger">
              {t('describe.error', { min: DESCRIPTION_MIN_LENGTH })}
            </p>
          ) : <span />}
          <p className="m-0 shrink-0 text-sm text-ink-muted">
            {t('describe.counter', { count: draft.description.length, max: DESCRIPTION_MAX_LENGTH })}
          </p>
        </div>
      </div>

      {draft.transcriptPending ? (
        <div className="flex flex-col gap-3">
          <InfoNote icon={TextCursorInput} text={`${t('describe.transcriptTitle')}. ${t('describe.transcriptBody')}`} />
          {showTranscriptError ? (
            <p role="alert" className="m-0 text-sm font-medium text-danger">{t('describe.transcriptNeeded')}</p>
          ) : null}
          <Button variant="tonal" icon={<Check className="size-5" aria-hidden />} onClick={() => { update({ transcriptPending: false }) }}>
            {t('describe.transcriptConfirm')}
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="secondary" className="sm:flex-1" icon={<Mic className="size-5" aria-hidden />} onClick={() => { setVoiceOpen(true) }}>
          {t('describe.voice')}
        </Button>
        {draft.description.length > 0 ? (
          <Button variant="text" className="sm:flex-1" icon={<RotateCcw className="size-5" aria-hidden />} onClick={() => { reset(); setAttempted(false) }}>
            {t('describe.startOver')}
          </Button>
        ) : null}
      </div>

      <VoiceInputDialog open={voiceOpen} onClose={() => { setVoiceOpen(false) }} onTranscript={onTranscript} />
    </StepLayout>
  )
}
