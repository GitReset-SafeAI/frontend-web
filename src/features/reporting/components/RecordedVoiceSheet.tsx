import { Loader2, Mic, MicOff, RefreshCw, Square } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ApiError } from '../../../services/api/ApiError'
import { Button, ButtonLink } from '../../../shared/components/Button'
import { InfoNote } from '../../../shared/components/InfoNote'
import { useAuth } from '../../account/authContext'
import { MAX_RECORDING_SECONDS, startWavRecording, VoiceCaptureError, type WavRecording } from '../audio/wavRecorder'
import { useTranscribeVoice } from '../hooks/useSubmitReport'

type Phase = 'idle' | 'permission' | 'recording' | 'stopping' | 'ready' | 'transcribing' | 'error'

function errorKey(error: unknown): string {
  if (error instanceof VoiceCaptureError) return `voice.errors.${error.kind}`
  if (error instanceof ApiError) {
    if (error.status === 413) return 'voice.errors.tooLarge'
    if (error.status === 415) return 'voice.errors.format'
    if (error.status === 422) return 'voice.errors.noSpeech'
    if (error.status === 503 || error.kind === 'server') return 'voice.errors.unavailable'
    if (error.kind === 'unauthorized' || error.kind === 'forbidden') return 'voice.errors.auth'
    if (error.kind === 'configuration') return 'voice.errors.configuration'
    if (error.kind === 'network' || error.kind === 'timeout') return 'voice.errors.network'
  }
  return 'voice.errors.generic'
}

export function RecordedVoiceSheet({ onClose, onTranscript }: { onClose: () => void; onTranscript: (text: string) => void }) {
  const { t } = useTranslation('reporting')
  const { t: tc } = useTranslation()
  const { user, status } = useAuth()
  const transcribe = useTranscribeVoice()
  const [phase, setPhase] = useState<Phase>('idle')
  const [seconds, setSeconds] = useState(0)
  const [audio, setAudio] = useState<Blob>()
  const [error, setError] = useState<string>()
  const live = useRef(true)
  const busy = useRef(false)
  const recorder = useRef<WavRecording | undefined>(undefined)
  const capture = useRef<AbortController | undefined>(undefined)
  const upload = useRef<AbortController | undefined>(undefined)

  useEffect(() => {
    live.current = true
    return () => {
      live.current = false
      capture.current?.abort()
      recorder.current?.cancel()
      upload.current?.abort()
      transcribe.reset()
    }
  }, [transcribe.reset])

  const stop = useCallback(async () => {
    if (!recorder.current || busy.current) return
    busy.current = true
    setPhase('stopping')
    try {
      const recorded = await recorder.current.stop()
      if (live.current) { setAudio(recorded); setPhase('ready') }
    } catch (failure) {
      if (live.current) { setError(errorKey(failure)); setPhase('error') }
    } finally { recorder.current = undefined; busy.current = false }
  }, [])

  useEffect(() => {
    if (phase !== 'recording') return
    const timer = setInterval(() => { setSeconds((value) => Math.min(value + 1, MAX_RECORDING_SECONDS)) }, 1000)
    // Stop locally at the backend limit; uploading still requires an explicit click.
    const limit = setTimeout(() => { void stop() }, MAX_RECORDING_SECONDS * 1000)
    return () => { clearInterval(timer); clearTimeout(limit) }
  }, [phase, stop])

  const start = async () => {
    if (busy.current || recorder.current || !user || status !== 'ready') return
    busy.current = true
    capture.current?.abort()
    capture.current = new AbortController()
    setAudio(undefined); setError(undefined); setSeconds(0); setPhase('permission')
    transcribe.reset()
    try {
      const recording = await startWavRecording(capture.current.signal, () => { void stop() })
      if (!live.current) { recording.cancel(); return }
      recorder.current = recording
      setPhase('recording')
    } catch (failure) {
      if (live.current) { setError(errorKey(failure)); setPhase('error') }
    } finally { busy.current = false }
  }

  const send = async () => {
    if (!audio || busy.current) return
    busy.current = true
    upload.current = new AbortController()
    setError(undefined); setPhase('transcribing')
    try {
      const { text } = await transcribe.mutateAsync({ audio, signal: upload.current.signal })
      if (live.current && !upload.current.signal.aborted) onTranscript(text)
    } catch (failure) {
      if (live.current && !upload.current.signal.aborted) { setError(errorKey(failure)); setPhase('error') }
    } finally { busy.current = false }
  }

  const waiting = ['permission', 'stopping', 'transcribing'].includes(phase)
  const canRecord = ['idle', 'ready', 'error'].includes(phase)
  const needsLogin = (status === 'ready' && !user) || error === 'voice.errors.auth'
  const stateText = phase === 'recording'
    ? t('voice.recording', { time: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` })
    : t(`voice.states.${phase}`)

  return (
    <>
      <h2 id="voice-title" className="text-xl font-semibold">{t('voice.title')}</h2>
      <InfoNote text={t('voice.recordingNote', { max: MAX_RECORDING_SECONDS })} />
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        {waiting ? <Loader2 className="size-14 animate-spin text-navy" aria-hidden />
          : phase === 'error' ? <MicOff className="size-14 text-danger" aria-hidden />
            : <Mic className="size-14 text-navy" aria-hidden />}
        <p role="status" className="m-0 text-lg">{stateText}</p>
      </div>
      {error ? <InfoNote tone="error" text={t(error)} /> : null}
      {needsLogin ? (
        <>
          {!error ? <InfoNote text={t('voice.errors.auth')} /> : null}
          <ButtonLink to="/login" state={{ from: '/report', reauthenticate: true }} variant="secondary">{t('review.loginAgain')}</ButtonLink>
        </>
      ) : null}
      {phase === 'recording' ? <Button icon={<Square className="size-5" aria-hidden />} onClick={() => { void stop() }}>{t('voice.stopRecording')}</Button> : null}
      {audio && (phase === 'ready' || phase === 'error') ? (
        <Button disabled={needsLogin} icon={<RefreshCw className="size-5" aria-hidden />} onClick={() => { void send() }}>{t(phase === 'error' ? 'voice.retryTranscription' : 'voice.transcribe')}</Button>
      ) : null}
      {canRecord ? <Button variant={phase === 'idle' ? 'primary' : 'secondary'} disabled={status !== 'ready' || needsLogin} onClick={() => { void start() }}>{t(phase === 'idle' ? 'voice.start' : 'voice.recordAgain')}</Button> : null}
      <Button variant="text" onClick={onClose}>{tc('cancel')}</Button>
    </>
  )
}
