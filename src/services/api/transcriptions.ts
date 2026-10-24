import { env } from '../../config/env'
import { getSupabaseAccessToken } from '../auth/supabaseSession'
import { transcriptionResponseSchema, type VoiceTranscript } from '../contracts/incident'
import { ApiError } from './ApiError'
import { createApiClient } from './client'

// Backend upload deadline is 30 s and provider deadline is 30 s by default.
const client = createApiClient(env.apiBaseUrl, 65_000)

export async function transcribeVoice(audio?: Blob, signal?: AbortSignal): Promise<VoiceTranscript> {
  if (!audio || audio.size <= 44) throw new ApiError('validation', 'Record some audio first.', 422)
  if (audio.size > 10 * 1024 * 1024) throw new ApiError('validation', 'The recording is too large.', 413)
  if (audio.type !== 'audio/wav') throw new ApiError('validation', 'PCM WAV audio is required.', 415)
  if (signal?.aborted) throw new ApiError('cancelled', 'Transcription was cancelled.')
  const token = await getSupabaseAccessToken()
  if (signal?.aborted) throw new ApiError('cancelled', 'Transcription was cancelled.')
  // Omitting the optional query hint uses the backend's `unknown` default.
  // Neither the UI locale nor the existing draft establishes the spoken language.
  const response = await client.request('/api/v1/reporting/transcriptions', transcriptionResponseSchema, {
    method: 'POST',
    headers: { 'Content-Type': 'audio/wav', Authorization: `Bearer ${token}` },
    body: audio,
    signal,
    credentials: 'omit',
    redirect: 'error',
  })
  return { text: response.transcript }
}
