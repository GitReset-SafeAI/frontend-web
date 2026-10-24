import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { CurrentSafetyStatus, LightingCondition } from '../../../services/contracts'
import { currentSafetyStatuses, lightingConditions } from '../../../services/contracts/incident'
import { Button } from '../../../shared/components/Button'
import { ChoiceGroup } from '../../../shared/components/ChoiceGroup'
import { StepLayout } from '../../../shared/layouts/StepLayout'
import { ReportAside } from '../components/ReportAside'
import { useReportDraft } from '../reportDraftContext'

export function ReportDetailsScreen() {
  const { t } = useTranslation('reporting')
  const { t: tc } = useTranslation()
  const navigate = useNavigate()
  const { draft, update } = useReportDraft()
  const answered = Boolean(draft.lighting || draft.currentSafetyStatus)

  return (
    <StepLayout
      step={{ current: 3, total: 4 }}
      aside={<ReportAside />}
      title={t('details.title')}
      subtitle={t('details.subtitle')}
      footer={(
        <>
          <Button variant="secondary" onClick={() => { void navigate('/report/when') }}>{tc('back')}</Button>
          <Button onClick={() => { void navigate('/report/review') }}>{answered ? tc('next') : tc('skip')}</Button>
        </>
      )}
    >
      <div className="flex flex-col gap-8">
        <ChoiceGroup<LightingCondition>
          label={t('details.lighting')}
          options={lightingConditions.map((value) => ({ value, label: t(`details.lightingOptions.${value}`) }))}
          value={draft.lighting}
          onChange={(lighting) => { update({ lighting }) }}
        />
        <ChoiceGroup<CurrentSafetyStatus>
          label={t('details.currentSafety')}
          options={currentSafetyStatuses.map((value) => ({ value, label: t(`details.currentSafetyOptions.${value}`) }))}
          value={draft.currentSafetyStatus}
          onChange={(currentSafetyStatus) => { update({ currentSafetyStatus }) }}
        />
      </div>
    </StepLayout>
  )
}
