import type { AppServices } from '../contracts'
import { ApiError } from './ApiError'

// No endpoint or authentication contract exists yet. Do not guess either.
const notAgreed = (what: string) => async (): Promise<never> => {
  throw new ApiError('not-implemented', `The backend ${what} contract has not been agreed.`)
}

export const apiServices: AppServices = {
  reports: {
    submitReport: notAgreed('report submission'),
    transcribeVoice: notAgreed('transcription'),
  },
  hotspots: { listHotspots: notAgreed('hotspot') },
}
