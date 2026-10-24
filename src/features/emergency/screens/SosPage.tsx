import { PhoneCall, PhoneOff } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'

import { Button } from '../../../shared/components/Button'
import { emergencyNumbers, SOS_COUNTDOWN_SECONDS } from '../emergencyNumbers'

type Phase = 'countdown' | 'dialing' | 'called' | 'failed'

// Tap SOS -> short cancellable countdown -> dial. One tap is enough in an emergency, while the
// countdown and a large Cancel protect against accidental presses.
export function SosPage() {
  const { t } = useTranslation('emergency')
  const { t: tw } = useTranslation('web')
  const navigate = useNavigate()
  const location = useLocation()
  const [phase, setPhase] = useState<Phase>('countdown')
  const [secondsLeft, setSecondsLeft] = useState(SOS_COUNTDOWN_SECONDS)
  const [dialled, setDialled] = useState<string>(emergencyNumbers.police)

  const close = useCallback(() => {
    // `default` means this page was opened directly, so there is nothing to go back to.
    if (location.key === 'default') void navigate('/emergency', { replace: true })
    else void navigate(-1)
  }, [location.key, navigate])

  const dial = useCallback((number: string) => {
    setDialled(number)
    setPhase('dialing')
    try {
      // A tel: link only does something on devices with a phone app; the page says so below.
      window.location.href = `tel:${number}`
      setPhase('called')
    } catch {
      setPhase('failed')
    }
  }, [])

  useEffect(() => {
    if (phase !== 'countdown') return
    const timer = setTimeout(() => {
      if (secondsLeft <= 1) {
        setSecondsLeft(0)
        dial(emergencyNumbers.police)
      } else {
        setSecondsLeft(secondsLeft - 1)
      }
    }, 1000)
    return () => { clearTimeout(timer) }
  }, [phase, secondsLeft, dial])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey) }
  }, [close])

  const ended = phase === 'called' || phase === 'failed'

  return (
    <div className="flex min-h-svh flex-col bg-sos text-white [&_:focus-visible]:outline-white [&_:focus-visible]:shadow-none">
      <p className="sr-only" role="status">
        {t('announceStart', { number: emergencyNumbers.police, seconds: SOS_COUNTDOWN_SECONDS })}
      </p>

      {phase === 'countdown' ? (
        <>
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">
              {t('countdownTitle', { number: emergencyNumbers.police })}
            </h1>
            <p className="m-0 text-[8.75rem] font-extrabold leading-none sm:text-[11rem]" aria-hidden>{secondsLeft}</p>
            <p className="m-0 text-2xl font-semibold" role="timer" aria-live="off">
              {t('secondsLabel', { count: secondsLeft })}
            </p>
          </div>
          <Actions>
            <Button variant="light" onClick={() => { dial(emergencyNumbers.police) }}>{t('callNow')}</Button>
            <Button variant="outlineLight" autoFocus onClick={close}>{t('cancel')}</Button>
            <Button variant="textLight" onClick={() => { dial(emergencyNumbers.ambulance) }}>
              {t('callAmbulance', { number: emergencyNumbers.ambulance })}
            </Button>
            <p className="m-0 text-center">{t('disclaimer')}</p>
          </Actions>
        </>
      ) : null}

      {phase === 'dialing' ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <p role="status" className="m-0 text-2xl font-semibold">{t('dialingTitle')}</p>
        </div>
      ) : null}

      {ended ? (
        <>
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            {phase === 'called' ? <PhoneCall className="size-[72px]" aria-hidden /> : <PhoneOff className="size-[72px]" aria-hidden />}
            <h1 className="text-3xl font-bold text-white" role="status">
              {phase === 'called' ? t('calledTitle') : t('failedTitle')}
            </h1>
            <p className="m-0 max-w-md text-lg">
              {phase === 'called' ? t('calledBody') : t('failedBody', { number: dialled })}
            </p>
            {phase === 'called' ? <p className="m-0 max-w-md">{tw('sos.desktopHint', { number: dialled })}</p> : null}
          </div>
          <Actions>
            <Button variant="light" onClick={() => { dial(emergencyNumbers.police) }}>
              {t('callPoliceAgain', { number: emergencyNumbers.police })}
            </Button>
            <Button variant="outlineLight" onClick={() => { dial(emergencyNumbers.ambulance) }}>
              {t('callAmbulanceAgain', { number: emergencyNumbers.ambulance })}
            </Button>
            <Button variant="textLight" onClick={close}>{t('close')}</Button>
          </Actions>
        </>
      ) : null}
    </div>
  )
}

function Actions({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex w-full max-w-md flex-col gap-3 p-6">{children}</div>
}
