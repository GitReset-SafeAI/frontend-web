import type { AppServices } from '../contracts'
import { ApiError } from './ApiError'
import { submitReport } from './reports'

// Report creation is connected; other data adapters still fail explicitly.
const notAgreed = (what: string) => async (): Promise<never> => {
  throw new ApiError('not-implemented', `The backend ${what} contract has not been agreed.`)
}

export const apiServices: AppServices = {
  reports: {
    submitReport,
    transcribeVoice: notAgreed('transcription'),
  },
  hotspots: { listHotspots: notAgreed('hotspot') },
  auth: {
    subscribe() { return () => undefined },
    getSession: notAgreed('authentication'),
    signUp: notAgreed('authentication'),
    logIn: notAgreed('authentication'),
    logOut: notAgreed('authentication'),
  },
  contacts: {
    list: notAgreed('emergency contacts'),
    add: notAgreed('emergency contacts'),
    update: notAgreed('emergency contacts'),
    remove: notAgreed('emergency contacts'),
    makePrimary: notAgreed('emergency contacts'),
  },
}
