import { PhoneCall, PhoneOff } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'

import type { EmergencyContact } from '../../../services/contracts'
import { Button } from '../../../shared/components/Button'
import { useAuth } from '../../account/authContext'
import { formatPhone } from '../../account/phone'
import { NoContactPrompt } from '../components/NoContactPrompt'
import { useSosContacts } from '../hooks/useSosContacts'
import { openPhoneCall } from '../phoneCall'
import { openSmsDraft } from '../sms'
import { useEmergencyLocation } from '../hooks/useEmergencyLocation'


function Actions({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex w-full max-w-md flex-col gap-3 p-6">{children}</div>
}

// SOS presents Call and Send location. Only an explicit choice opens a phone app.
export function SosPage() {
  const { t } = useTranslation('emergency')
  const { t: tc } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const sos = useSosContacts()
  const { user } = useAuth()

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

      {sos.state === 'ready' ? <SosFlow key={user?.id} primary={sos.primary} contacts={sos.contacts} onClose={close} /> : null}
    </div>
  )
}

interface SosFlowProps {
  primary: EmergencyContact
  contacts: EmergencyContact[]
  onClose: () => void
}

function SosFlow({ primary, contacts, onClose }: SosFlowProps) {
  const { t } = useTranslation('emergency')
  const [selectedId, setSelectedId] = useState(primary.id)
  const [callError, setCallError] = useState(false)
  const [copied, setCopied] = useState(false)
  const tracking = useEmergencyLocation()
  const selected = contacts.find((contact) => contact.id === selectedId) ?? primary

  const call = () => {
    try { openPhoneCall(selected.phone); setCallError(false) } catch { setCallError(true) }
  }
  const copy = async () => {
    if (!tracking.message) return
    try { await navigator.clipboard.writeText(tracking.message); setCopied(true) } catch { setCopied(false) }
  }
  return <>
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-5 px-6 py-8">
      <h1 className="display-md text-white">{t('sms.choose')}</h1>
      <label className="flex flex-col gap-2 font-semibold">
        {t('sms.contact')}
        <select value={selected.id} onChange={(event) => { setSelectedId(event.target.value); setCopied(false) }}
          disabled={tracking.busy} className="min-h-12 rounded-lg border-2 border-white bg-white px-4 text-navy">
          {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name} — {formatPhone(contact.phone)}</option>)}
        </select>
      </label>
      <Button variant="light" icon={<PhoneCall className="size-5" aria-hidden />} onClick={call}>{t('sms.call')}</Button>
      <Button variant="outlineLight" loading={tracking.busy} onClick={() => { void tracking.send(selected.phone) }}>
        {tracking.busy ? t('sms.preparing') : t('sms.sendLocation')}
      </Button>
      {callError ? <p role="alert">{t('failedBody', { number: formatPhone(selected.phone) })}</p> : null}
      {tracking.error ? <p role="alert">{t('sms.errors.' + tracking.error)}</p> : null}
      {tracking.message ? <>
        <p className="m-0" role="status">{t('sms.draftReady')}</p>
        <label className="flex flex-col gap-2">
          {t('sms.preview')}
          <textarea readOnly rows={5} value={tracking.message} className="w-full rounded-lg bg-white p-3 text-navy" />
        </label>
        <Button variant="light" onClick={() => { openSmsDraft(selected.phone, tracking.message!) }}>{t('sms.reopen')}</Button>
        {typeof navigator.clipboard?.writeText === 'function' ? <Button variant="outlineLight" onClick={() => { void copy() }}>{t(copied ? 'sms.copied' : 'sms.copy')}</Button> : null}
      </> : null}
      {tracking.share ? <>
        <p className="m-0 text-sm">{t('sms.sharingNote')}</p>
        <Button variant="outlineLight" disabled={tracking.busy} onClick={() => { void tracking.stop() }}>{t('sms.stop')}</Button>
      </> : null}
      <p className="m-0 text-sm">{t('sms.costNote')}</p>
      <Button variant="textLight" onClick={onClose}>{t('close')}</Button>
    </div>
  </>
}
