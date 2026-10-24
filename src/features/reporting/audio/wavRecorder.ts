export const MAX_RECORDING_SECONDS = 60

export class VoiceCaptureError extends Error {
  readonly kind: 'unsupported' | 'denied' | 'device' | 'empty' | 'capture'

  constructor(kind: VoiceCaptureError['kind']) {
    super('Voice recording could not be completed.')
    this.kind = kind
  }
}

export interface WavRecording {
  stop(): Promise<Blob>
  cancel(): void
}

// Capture PCM directly: MediaRecorder's common WebM/Opus output is not accepted
// by this backend. The worklet emits silent output so the microphone is not played back.
const processor = `
class PcmCapture extends AudioWorkletProcessor {
  constructor() {
    super(); this.active = true; this.buffer = new Float32Array(4096); this.offset = 0;
    this.port.onmessage = () => {
      this.active = false;
      if (this.offset) this.port.postMessage(this.buffer.slice(0, this.offset));
      this.port.postMessage('stopped');
    };
  }
  process(inputs) {
    if (!this.active) return false;
    const samples = inputs[0] && inputs[0][0];
    if (samples) for (const sample of samples) {
      this.buffer[this.offset++] = sample;
      if (this.offset === this.buffer.length) {
        this.port.postMessage(this.buffer, [this.buffer.buffer]);
        this.buffer = new Float32Array(4096); this.offset = 0;
      }
    }
    return true;
  }
}
registerProcessor('pcm-capture', PcmCapture);
`

function encodeWav(chunks: Float32Array[], frames: number, sampleRate: number): Blob {
  if (!frames) throw new VoiceCaptureError('empty')
  const buffer = new ArrayBuffer(44 + frames * 2)
  const view = new DataView(buffer)
  const write = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index++) view.setUint8(offset + index, value.charCodeAt(index))
  }
  write(0, 'RIFF'); view.setUint32(4, 36 + frames * 2, true); write(8, 'WAVE')
  write(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true)
  view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true)
  write(36, 'data'); view.setUint32(40, frames * 2, true)
  let offset = 44
  let nonzero = false
  for (const chunk of chunks) for (const sample of chunk) {
    const clipped = Math.max(-1, Math.min(1, sample))
    const pcm = Math.round(clipped * (clipped < 0 ? 32768 : 32767))
    view.setInt16(offset, pcm, true)
    nonzero ||= pcm !== 0
    offset += 2
  }
  if (!nonzero) throw new VoiceCaptureError('empty')
  return new Blob([buffer], { type: 'audio/wav' })
}

export async function startWavRecording(signal: AbortSignal, onLimit: () => void): Promise<WavRecording> {
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.AudioContext || !window.AudioWorkletNode) {
    throw new VoiceCaptureError('unsupported')
  }
  const context = new AudioContext()
  let stream: MediaStream | undefined
  let source: MediaStreamAudioSourceNode | undefined
  let node: AudioWorkletNode | undefined
  let chunks: Float32Array[] = []
  let frames = 0
  let stopping = false
  let disposed = false
  let finish: (() => void) | undefined
  const dispose = () => {
    disposed = true
    signal.removeEventListener('abort', dispose)
    stream?.getTracks().forEach((track) => { track.stop() })
    source?.disconnect()
    node?.disconnect()
    void context.close().catch(() => undefined)
    chunks = []
    finish?.()
  }
  signal.addEventListener('abort', dispose, { once: true })
  try {
    if (signal.aborted || !context.audioWorklet || context.sampleRate < 8000 || context.sampleRate > 48000) throw new VoiceCaptureError('unsupported')
    // Resume during the click gesture; microphone permission may resolve much later.
    await context.resume()
    if (signal.aborted) throw new VoiceCaptureError('capture')
    stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 }, video: false })
    if (signal.aborted) throw new VoiceCaptureError('capture')
    const url = URL.createObjectURL(new Blob([processor], { type: 'text/javascript' }))
    try { await context.audioWorklet.addModule(url) } finally { URL.revokeObjectURL(url) }
    if (signal.aborted) throw new VoiceCaptureError('capture')
    source = context.createMediaStreamSource(stream)
    node = new AudioWorkletNode(context, 'pcm-capture', { channelCount: 1, channelCountMode: 'explicit' })
    node.port.onmessage = (event: MessageEvent<Float32Array | string>) => {
      if (disposed) return
      if (event.data === 'stopped') { finish?.(); return }
      if (!(event.data instanceof Float32Array)) return
      const remaining = MAX_RECORDING_SECONDS * context.sampleRate - frames
      if (remaining <= 0) return
      const chunk = event.data.slice(0, remaining)
      chunks.push(chunk)
      frames += chunk.length
      if (frames >= MAX_RECORDING_SECONDS * context.sampleRate && !stopping) onLimit()
    }
    source.connect(node)
    node.connect(context.destination)
    return {
      async stop() {
        stopping = true
        let flushFailed = false
        // Flush the last partial worklet buffer before encoding the complete WAV.
        await new Promise<void>((resolve) => {
          const timer = setTimeout(() => { flushFailed = true; resolve() }, 2000)
          finish = () => { clearTimeout(timer); resolve() }
          if (signal.aborted) finish()
          else node!.port.postMessage('stop')
        })
        try {
          if (signal.aborted || flushFailed) throw new VoiceCaptureError('capture')
          return encodeWav(chunks, frames, context.sampleRate)
        } finally { dispose() }
      },
      cancel: dispose,
    }
  } catch (error) {
    dispose()
    if (error instanceof VoiceCaptureError) throw error
    if (error instanceof DOMException && ['NotAllowedError', 'SecurityError'].includes(error.name)) throw new VoiceCaptureError('denied')
    if (error instanceof DOMException && ['NotFoundError', 'NotReadableError'].includes(error.name)) throw new VoiceCaptureError('device')
    throw new VoiceCaptureError('capture')
  }
}
