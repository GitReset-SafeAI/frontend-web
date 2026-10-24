import { Hand, PhoneCall, PhoneOutgoing, Siren, Timer } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { InfoNote } from '../../../shared/components/InfoNote'
import { SosButton } from '../components/SosButton'
import { emergencyNumbers, SOS_COUNTDOWN_SECONDS } from '../emergencyNumbers'

const callLink =
  'flex min-h-14 items-center justify-center gap-2 rounded-full border-2 border-navy bg-surface px-5 font-semibold text-navy hover:bg-mint-soft'

// One giant SOS button, and nothing competing with it. The timeline beside it removes any surprise:
// people should know exactly what a tap does before they need it.
export function EmergencyPage() {
  const { t } = useTranslation('emergency')
  const navigate = useNavigate()
  const params = { seconds: SOS_COUNTDOWN_SECONDS, number: emergencyNumbers.police }
  const steps = [
    { icon: Hand, text: t('timeline.tap') },
    { icon: Timer, text: t('timeline.wait', params) },
    { icon: PhoneOutgoing, text: t('timeline.call', params) },
  ]

  return (
    <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-16">
      <div className="flex flex-col items-center gap-8 text-center">
        <SosButton onPress={() => { void navigate('/sos') }} />
        <div className="flex flex-col items-center gap-2">
          <h1 className="display-md">{t('homeCaption')}</h1>
          <p className="m-0 max-w-sm text-ink-muted">{t('homeHint', params)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <div>
          <h2 className="font-sans text-lg font-bold tracking-normal">{t('timeline.title')}</h2>
          <ol className="relative m-0 mt-5 flex list-none flex-col gap-6 p-0">
            <span className="absolute bottom-5 left-5 top-5 w-1 -translate-x-1/2 rounded-full bg-navy" aria-hidden />
            {steps.map(({ icon: StepIcon, text }, index) => (
              <li key={text} className="relative flex items-center gap-4 pl-0">
                <span
                  className={`relative z-10 grid size-10 shrink-0 place-items-center rounded-full border-4 border-navy text-navy ${index === steps.length - 1 ? 'bg-sos text-white' : 'bg-mint'}`}
                >
                  <StepIcon className="size-5" aria-hidden />
                </span>
                <p className="m-0 text-lg">{text}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <a href={`tel:${emergencyNumbers.police}`} className={callLink}>
            <PhoneCall className="size-5" aria-hidden />
            {t('callPoliceAgain', { number: emergencyNumbers.police })}
          </a>
          <a href={`tel:${emergencyNumbers.ambulance}`} className={callLink}>
            <Siren className="size-5" aria-hidden />
            {t('callAmbulanceAgain', { number: emergencyNumbers.ambulance })}
          </a>
        </div>

        <InfoNote text={t('disclaimer')} />
      </div>
    </div>
  )
}
