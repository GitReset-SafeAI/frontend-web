import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { CrowdLevel, LightingLevel, NearbyAnswer } from '../../../services/contracts'
import { crowdLevels, lightingLevels, nearbyAnswers } from '../../../services/contracts/incident'
import { Button } from '../../../shared/components/Button'
import { ChoiceGroup } from '../../../shared/components/ChoiceGroup'
import { StepLayout } from '../../../shared/layouts/StepLayout'
import { useReportDraft } from '../reportDraftContext'

export function ReportDetailsScreen() {
  const { t } = useTranslation('reporting')
  const { t: tc } = useTranslation()
  const navigate = useNavigate()
  const { draft, update } = useReportDraft()
  const answered = Boolean(draft.lighting || draft.crowd || draft.othersNearby)

  return (
    <StepLayout
      step={{ current: 3, total: 3 }}
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
        <ChoiceGroup<LightingLevel>
          label={t('details.lighting')}
          options={lightingLevels.map((value) => ({ value, label: t(`details.lightingOptions.${value}`) }))}
          value={draft.lighting}
          onChange={(lighting) => { update({ lighting }) }}
        />
        <ChoiceGroup<CrowdLevel>
          label={t('details.crowd')}
          options={crowdLevels.map((value) => ({ value, label: t(`details.crowdOptions.${value}`) }))}
          value={draft.crowd}
          onChange={(crowd) => { update({ crowd }) }}
        />
        <ChoiceGroup<NearbyAnswer>
          label={t('details.others')}
          options={nearbyAnswers.map((value) => ({ value, label: t(`details.othersOptions.${value}`) }))}
          value={draft.othersNearby}
          onChange={(othersNearby) => { update({ othersNearby }) }}
        />
      </div>
    </StepLayout>
  )
}
