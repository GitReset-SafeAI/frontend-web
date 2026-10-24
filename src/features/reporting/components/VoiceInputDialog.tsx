import { Loader2, Mic, MicOff, RefreshCw, Square } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '../../../shared/components/Button'
import { Dialog } from '../../../shared/components/Dialog'
import { InfoNote } from '../../../shared/components/InfoNote'
import { useTranscribeVoice } from '../hooks/useSubmitReport'

type Phase = 'idle' | 'recording' | 'transcribing' | 'error'

interface VoiceInputDialogProps {
  open: boolean
  onClose: () => void
  // The transcript is inserted into the editable description field; the user must review it.
  onTranscript: (text: string) => void
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function VoiceInputDialog({ open, onClose, onTranscript }: VoiceInputDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} labelledBy="voice-title">
      <VoiceSheet onClose={onClose} onTranscript={onTranscript} />
    </Dialog>
  )
}

// Demo flow: no microphone access and no audio is captured. The mock service returns a sample
// transcript so the review/edit step can be designed and tested before the speech backend exists.
function VoiceSheet({ onClose, onTranscript }: Omit<VoiceInputDialogProps, 'open'>) {
  const { t } = useTranslation('reporting')
  const { t: tc } = useTranslation()
  const transcribe = useTranscribeVoice()
  const [phase, setPhase] = useState<Phase>('idle')
  const [seconds, setSeconds] = useState(0)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    if (phase !== 'recording') return
    const timer = setInterval(() => { setSeconds((value) => value + 1) }, 1000)
    return () => { clearInterval(timer) }
  }, [phase])

  const stop = async () => {
    setPhase('transcribing')
    try {
      const { text } = await transcribe.mutateAsync()
      if (mounted.current) onTranscript(text)
    } catch {
      if (mounted.current) setPhase('error')
    }
  }

  const retry = () => { setPhase('idle'); setSeconds(0) }

  const status = phase === 'recording' ? t('voice.recording', { time: formatTime(seconds) })
    : phase === 'transcribing' ? t('voice.transcribing')
      : phase === 'error' ? t('voice.error')
        : t('voice.idle')

  return (
    <>
      <h2 id="voice-title" className="text-xl font-semibold">{t('voice.title')}</h2>
      <InfoNote text={t('voice.demoNote')} />
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        {phase === 'transcribing' ? <Loader2 className="size-14 animate-spin text-navy" aria-hidden />
          : phase === 'error' ? <MicOff className="size-14 text-danger" aria-hidden />
            : <Mic className="size-14 text-navy" aria-hidden />}
        <p role="status" className="m-0 text-lg">{status}</p>
      </div>
      {phase === 'idle' ? (
        <Button icon={<Mic className="size-5" aria-hidden />} onClick={() => { setPhase('recording') }}>{t('voice.start')}</Button>
      ) : null}
      {phase === 'recording' ? (
        <Button icon={<Square className="size-5" aria-hidden />} onClick={() => { void stop() }}>{t('voice.stop')}</Button>
      ) : null}
      {phase === 'error' ? (
        <Button icon={<RefreshCw className="size-5" aria-hidden />} onClick={retry}>{t('voice.retry')}</Button>
      ) : null}
      <Button variant="text" onClick={onClose}>{tc('cancel')}</Button>
    </>
  )
}
