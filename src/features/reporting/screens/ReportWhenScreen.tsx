import { Crosshair, LocateOff, Loader2, MapPin } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { type ApproximateLocation, type ReportedTimePeriod } from '../../../services/contracts'
import { reportedTimePeriods } from '../../../services/contracts/incident'
import { Button } from '../../../shared/components/Button'
import { ChoiceGroup } from '../../../shared/components/ChoiceGroup'
import { InfoNote } from '../../../shared/components/InfoNote'
import { Field } from '../../../shared/components/Field'
import { StepLayout } from '../../../shared/layouts/StepLayout'
import { ReportAside } from '../components/ReportAside'
import { DistrictPicker } from '../components/DistrictPicker'
import { districts } from '../districts'
import { useApproximateLocation } from '../hooks/useApproximateLocation'
import { useReportDraft } from '../reportDraftContext'

export function ReportWhenScreen() {
  const { t } = useTranslation('reporting')
  const { t: tc } = useTranslation()
  const navigate = useNavigate()
  const { draft, update } = useReportDraft()
  const [pickerOpen, setPickerOpen] = useState(false)

  const onLocated = useCallback((location: ApproximateLocation) => { update({ location }) }, [update])
  const { status, locate } = useApproximateLocation(onLocated)

  const timeOptions = reportedTimePeriods.map((value) => ({ value, label: t(`when.options.${value}`) }))
  const answered = Boolean(draft.reportedTime || draft.occurredAt || draft.location)
  const location = draft.location

  const selectDistrict = (id: string) => {
    const district = districts.find((entry) => entry.id === id)
    if (district) {
      update({ location: { latitude: district.latitude, longitude: district.longitude, source: 'district', districtId: id } })
    }
    setPickerOpen(false)
  }

  return (
    <StepLayout
      step={{ current: 2, total: 4 }}
      aside={<ReportAside />}
      title={t('when.title')}
      subtitle={t('when.subtitle')}
      footer={(
        <>
          <Button variant="secondary" onClick={() => { void navigate('/report') }}>{tc('back')}</Button>
          <Button onClick={() => { void navigate('/report/details') }}>{answered ? tc('next') : tc('skip')}</Button>
        </>
      )}
    >
      <ChoiceGroup<ReportedTimePeriod>
        label={t('when.whenLabel')}
        options={timeOptions}
        value={draft.reportedTime}
        onChange={(reportedTime) => { update({ reportedTime }) }}
      />

      <Field
        type="datetime-local"
        label={t('when.occurredAt')}
        hint={t('when.occurredAtHint')}
        value={draft.occurredAt ?? ''}
        onChange={(event) => { update({ occurredAt: event.target.value || undefined }) }}
      />

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-ink">{t('when.whereLabel')}</h2>
        <p className="m-0 text-ink-muted">{t('when.whereHint')}</p>

        {location ? (
          <div className="flex items-center gap-3 rounded-lg border-2 border-navy bg-mint-light p-4">
            {location.source === 'device'
              ? <Crosshair className="size-6 shrink-0 text-navy" aria-hidden />
              : <MapPin className="size-6 shrink-0 text-navy" aria-hidden />}
            <p className="m-0 flex-1">
              {location.source === 'device' || !location.districtId
                ? t('when.selectedCurrent')
                : t('when.selectedDistrict', { district: t(`districts.${location.districtId}`) })}
            </p>
            <Button variant="text" className="min-h-12" onClick={() => { update({ location: undefined }) }}>{t('when.remove')}</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="secondary"
              className="sm:flex-1"
              icon={status === 'locating' ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Crosshair className="size-5" aria-hidden />}
              disabled={status === 'locating'}
              onClick={locate}
            >
              {status === 'locating' ? t('when.locating') : t('when.useCurrent')}
            </Button>
            <Button variant="secondary" className="sm:flex-1" icon={<MapPin className="size-5" aria-hidden />} onClick={() => { setPickerOpen(true) }}>
              {t('when.pickDistrict')}
            </Button>
          </div>
        )}

        {status === 'denied' ? <InfoNote tone="error" icon={LocateOff} text={t('when.denied')} /> : null}
        {status === 'unavailable' ? <InfoNote tone="error" icon={LocateOff} text={t('when.unavailable')} /> : null}
      </div>

      <DistrictPicker
        open={pickerOpen}
        selected={location?.districtId}
        onSelect={selectDistrict}
        onClose={() => { setPickerOpen(false) }}
      />
    </StepLayout>
  )
}
