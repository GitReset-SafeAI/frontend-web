import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../../../services/api/ApiError'
import { env } from '../../../config/env'
import { emergencyLocation, type LocationFix, type SharedEmergencyLocation } from '../../../services/api/emergencyLocation'
import { useAuth } from '../../account/authContext'
import { openSmsDraft, SOS_SMS_TEXT, trackingUrl } from '../sms'

type Failure = 'account' | 'location' | 'network' | 'composer' | 'stop' | 'expired' | null
function locate(): Promise<LocationFix> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation || window.isSecureContext === false) { reject(new Error('Location unavailable')); return }
    navigator.geolocation.getCurrentPosition(
      (fix) => resolve({ position: { latitude: fix.coords.latitude, longitude: fix.coords.longitude }, accuracy_m: fix.coords.accuracy }),
      () => reject(new Error('Location unavailable')),
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 5_000 },
    )
  })
}

export function useEmergencyLocation() {
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  const [share, setShare] = useState<SharedEmergencyLocation | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<Failure>(null)
  const active = useRef<SharedEmergencyLocation | null>(null)
  const watch = useRef<number | null>(null)
  const revision = useRef(0)
  const pending = useRef(false)

  const clearWatch = useCallback(() => {
    if (watch.current !== null) navigator.geolocation?.clearWatch(watch.current)
    watch.current = null
  }, [])

  useEffect(() => {
    return () => {
      revision.current += 1
      pending.current = false
      clearWatch()
      const old = active.current
      active.current = null
      if (old) void emergencyLocation.end(old.share_id).catch(() => undefined)
    }
  }, [user?.id, clearWatch])

  const expiresAt = share?.expires_at
  useEffect(() => {
    if (!expiresAt) return
    const timer = setTimeout(() => {
      revision.current += 1
      pending.current = false
      clearWatch()
      active.current = null
      setShare(null)
      setMessage(null)
      setBusy(false)
      setError('expired')
    }, Math.max(0, Date.parse(expiresAt) - Date.now()))
    return () => { clearTimeout(timer) }
  }, [expiresAt, clearWatch])

  const stop = async () => {
    revision.current += 1
    clearWatch()
    const current = active.current
    if (!current) return
    setBusy(true)
    try {
      await emergencyLocation.end(current.share_id)
      active.current = null
      setShare(null)
      setMessage(null)
      setError(null)
    } catch { setError('stop') }
    finally { setBusy(false) }
  }

  const send = async (phone: string) => {
    if (pending.current) return
    if (!user || env.authMode !== 'supabase') { setError('account'); return }
    pending.current = true
    const request = ++revision.current
    setBusy(true)
    setError(null)
    try {
      let fix: LocationFix
      try { fix = await locate() }
      catch { if (revision.current === request) setError('location'); return }
      if (revision.current !== request) return
      const created = await emergencyLocation.start(fix)
      if (revision.current !== request) {
        void emergencyLocation.end(created.share_id).catch(() => undefined)
        return
      }
      clearWatch()
      active.current = created
      setShare(created)
      const body = SOS_SMS_TEXT + trackingUrl(created.share_id)
      setMessage(body)

      let lastSent = Date.now()
      let sending = false
      watch.current = navigator.geolocation.watchPosition((position) => {
        const current = active.current
        if (revision.current !== request || !current || sending || Date.now() - lastSent < 10_000) return
        if (Date.now() >= Date.parse(current.expires_at)) {
          clearWatch(); setError('network'); return
        }
        lastSent = Date.now()
        sending = true
        void emergencyLocation.update(current.share_id, {
          position: { latitude: position.coords.latitude, longitude: position.coords.longitude },
          accuracy_m: position.coords.accuracy,
        }).then((updated) => {
          if (revision.current === request) { active.current = updated; setShare(updated); setError(null) }
        }).catch(() => { if (revision.current === request) setError('network') })
          .finally(() => { sending = false })
      }, () => { if (revision.current === request) setError('location') },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 5_000 })

      try { openSmsDraft(phone, body) } catch { setError('composer') }
    } catch (failure) {
      if (revision.current === request) setError(failure instanceof ApiError && failure.kind === 'unauthorized' ? 'account' : 'network')
    }
    finally {
      if (revision.current === request) { pending.current = false; setBusy(false) }
    }
  }

  return { busy, share, message, error, send, stop }
}
