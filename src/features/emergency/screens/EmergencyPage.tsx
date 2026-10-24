import { Hand, PhoneCall, PhoneOutgoing, Timer } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'

import { formatPhone } from '../../account/phone'
import { InfoNote } from '../../../shared/components/InfoNote'
import { NoContactPrompt } from '../components/NoContactPrompt'
import { SosButton } from '../components/SosButton'
import { useSosContacts } from '../hooks/useSosContacts'
import { SOS_COUNTDOWN_SECONDS } from '../sos'

// One giant SOS button, and nothing competing with it. The timeline beside it removes any surprise:
// people should know exactly what a tap does before they need it, and who it will call.
export function EmergencyPage() {
  const { t } = useTranslation('emergency')
  const navigate = useNavigate()
  const sos = useSosContacts()
  const params = { seconds: SOS_COUNTDOWN_SECONDS }
  const steps = [
    { icon: Hand, text: t('timeline.tap') },
    { icon: Timer, text: t('timeline.wait', params) },
    { icon: PhoneOutgoing, text: sos.primary ? t('timeline.callNamed', { name: sos.primary.name }) : t('timeline.callGeneric') },
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
              <li key={text} className="relative flex items-center gap-4">
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

        {sos.state === 'ready' ? (
          <section aria-labelledby="sos-contacts" className="flex flex-col gap-3">
            <h2 id="sos-contacts" className="font-sans text-lg font-bold tracking-normal">{t('contacts.title')}</h2>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {sos.contacts.map((contact) => (
                <li key={contact.id}>
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex min-h-14 items-center justify-between gap-3 rounded-full border-2 border-navy bg-surface px-5 font-semibold text-navy hover:bg-mint-soft"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <PhoneCall className="size-5 shrink-0" aria-hidden />
                      <span className="truncate">{t('callContact', { name: contact.name })}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-ink-muted">{formatPhone(contact.phone)}</span>
                  </a>
                </li>
              ))}
            </ul>
            <Link to="/account" className="inline-flex min-h-11 w-fit items-center rounded-full px-2 font-semibold text-navy underline underline-offset-4">
              {t('contacts.manage')}
            </Link>
          </section>
        ) : null}

        {sos.state === 'loggedOut' || sos.state === 'noContacts' ? (
          <NoContactPrompt reason={sos.state} returnTo="/emergency" />
        ) : null}

        <InfoNote text={t('disclaimer')} />
      </div>
    </div>
  )
}
