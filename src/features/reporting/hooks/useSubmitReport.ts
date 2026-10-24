import { useMutation } from '@tanstack/react-query'

import { env } from '../../../config/env'
import { services } from '../../../services'
import type { ReportSubmission } from '../../../services/contracts'

// Mock data is local, so the demo also works offline.
const networkMode = env.dataMode === 'mock' ? 'always' : 'online'

export function useSubmitReport() {
  return useMutation({
    mutationFn: (submission: ReportSubmission) => services.reports.submitReport(submission),
    networkMode,
  })
}

export function useTranscribeVoice() {
  return useMutation({
    mutationFn: () => services.reports.transcribeVoice(),
    networkMode,
  })
}
