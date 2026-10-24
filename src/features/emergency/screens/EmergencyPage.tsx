import { PhoneCall, Siren } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { InfoNote } from '../../../shared/components/InfoNote'
import { SosButton } from '../components/SosButton'
import { emergencyNumbers, SOS_COUNTDOWN_SECONDS } from '../emergencyNumbers'

// Web counterpart of the mobile Home screen: one giant SOS button and nothing competing with it.
export function EmergencyPage() {
  const { t } = useTranslation('emergency')
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-4 py-10 text-center sm:px-6 sm:py-16">
      <SosButton onPress={() => { void navigate('/sos') }} />

      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">{t('homeCaption')}</h1>
        <p className="m-0 max-w-sm text-ink-muted">
          {t('homeHint', { seconds: SOS_COUNTDOWN_SECONDS, number: emergencyNumbers.police })}
        </p>
      </div>

      <div className="grid w-full max-w-xl gap-3 sm:grid-cols-2">
        <a
          href={`tel:${emergencyNumbers.police}`}
          className="flex min-h-14 items-center justify-center gap-2 rounded-sm border-2 border-ink-muted bg-surface px-4 font-semibold text-primary-dark hover:bg-tint-soft"
        >
          <PhoneCall className="size-5" aria-hidden />
          {t('callPoliceAgain', { number: emergencyNumbers.police })}
        </a>
        <a
          href={`tel:${emergencyNumbers.ambulance}`}
          className="flex min-h-14 items-center justify-center gap-2 rounded-sm border-2 border-ink-muted bg-surface px-4 font-semibold text-primary-dark hover:bg-tint-soft"
        >
          <Siren className="size-5" aria-hidden />
          {t('callAmbulanceAgain', { number: emergencyNumbers.ambulance })}
        </a>
      </div>

      <div className="w-full max-w-xl text-left">
        <InfoNote text={t('disclaimer')} />
      </div>
    </div>
  )
}
