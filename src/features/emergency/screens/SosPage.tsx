import { PhoneCall, PhoneOff } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'

import type { EmergencyContact } from '../../../services/contracts'
import { Button } from '../../../shared/components/Button'
import { formatPhone } from '../../account/phone'
import { NoContactPrompt } from '../components/NoContactPrompt'
import { useSosContacts } from '../hooks/useSosContacts'
import { openPhoneCall } from '../phoneCall'

type Phase = 'dialing' | 'called' | 'failed'

function Actions({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex w-full max-w-md flex-col gap-3 p-6">{children}</div>
}

// Open the primary contact immediately; the device controls call confirmation.
export function SosPage() {
  const { t } = useTranslation('emergency')
  const { t: tc } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const sos = useSosContacts()
  const callPhase = (location.state as { sosCall?: { phase?: unknown } } | null)?.sosCall?.phase
  const initialPhase = callPhase === 'called' || callPhase === 'failed' ? callPhase : undefined

  const close = useCallback(() => {
    // `default` means this page was opened directly, so there is nothing to go back to.
    if (location.key === 'default') void navigate('/emergency', { replace: true })
    else void navigate(-1)
  }, [location.key, navigate])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey) }
  }, [close])

  return (
    <div className="flex min-h-svh flex-col bg-sos text-white [&_:focus-visible]:shadow-none [&_:focus-visible]:outline-white">
      {sos.state === 'loading' ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <p role="status" className="m-0 text-2xl font-semibold">{tc('loading')}</p>
        </div>
      ) : null}

      {sos.state === 'error' ? (
        <>
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <PhoneOff className="size-[72px]" aria-hidden />
            <h1 className="display-md text-white">{tc('error')}</h1>
          </div>
          <Actions><Button variant="light" onClick={close}>{t('close')}</Button></Actions>
        </>
      ) : null}

      {sos.state === 'loggedOut' || sos.state === 'noContacts' ? (
        <>
          <NoContactPrompt reason={sos.state} returnTo="/sos" onRed />
          <Actions><Button variant="textLight" onClick={close}>{t('close')}</Button></Actions>
        </>
      ) : null}

      {sos.state === 'ready' ? <SosFlow initialPhase={initialPhase} primary={sos.primary} contacts={sos.contacts} onClose={close} /> : null}
    </div>
  )
}

interface SosFlowProps {
  initialPhase?: Phase
  primary: EmergencyContact
  contacts: EmergencyContact[]
  onClose: () => void
}

// Skip a duplicate call when Emergency already opened the dialer in its click handler.
function SosFlow({ primary, contacts, onClose, initialPhase = 'dialing' }: SosFlowProps) {
  const { t } = useTranslation('emergency')
  const { t: tw } = useTranslation('web')
  const [target] = useState(primary)
  const [phase, setPhase] = useState<Phase>(initialPhase)
  const autoDialStarted = useRef(initialPhase !== 'dialing')
  const [dialled, setDialled] = useState<EmergencyContact>(target)

  const dial = useCallback((contact: EmergencyContact) => {
    setDialled(contact)
    setPhase('dialing')
    try {
      // A tel: link only does something on devices with a phone app; the page says so below.
      openPhoneCall(contact.phone)
      setPhase('called')
    } catch {
      setPhase('failed')
    }
  }, [])

  useEffect(() => {
    // A direct /sos visit also opens once, including under StrictMode effect replay.
    if (autoDialStarted.current) return
    autoDialStarted.current = true
    dial(target)
  }, [dial, target])

  const ended = phase === 'called' || phase === 'failed'
  const others = contacts.filter((contact) => contact.id !== dialled.id)
  const number = formatPhone(dialled.phone)

  return (
    <>
      {phase === 'dialing' ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <p role="status" className="m-0 text-2xl font-semibold">{t('dialingTitle')}</p>
        </div>
      ) : null}

      {ended ? (
        <>
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            {phase === 'called' ? <PhoneCall className="size-[72px]" aria-hidden /> : <PhoneOff className="size-[72px]" aria-hidden />}
            <h1 className="display-md text-white" role="status">{phase === 'called' ? t('calledTitle') : t('failedTitle')}</h1>
            <p className="m-0 max-w-md text-lg">{phase === 'called' ? t('calledBody') : t('failedBody', { number })}</p>
            {/* Non-breaking spaces keep the number on one line. */}
            {phase === 'called' ? <p className="m-0 max-w-md">{tw('sos.desktopHint', { number: number.replace(/ /g, '\u00a0') })}</p> : null}
          </div>
          <Actions>
            <Button variant="light" onClick={() => { dial(dialled) }}>{t('callAgain', { name: dialled.name })}</Button>
            {others.map((contact) => (
              <Button key={contact.id} variant="outlineLight" onClick={() => { dial(contact) }}>
                {t('callContact', { name: contact.name })}
              </Button>
            ))}
            <Button variant="textLight" onClick={onClose}>{t('close')}</Button>
          </Actions>
        </>
      ) : null}
    </>
  )
}
