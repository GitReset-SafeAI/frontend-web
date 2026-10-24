import { useMutation } from '@tanstack/react-query'

import { env } from '../../../config/env'
import { services } from '../../../services'
import type { ReportSubmission } from '../../../services/contracts'

// Mock data is local, so the demo also works offline.
const networkMode = env.dataMode === 'mock' ? 'always' : 'online'

export function useSubmitReport() {
  return useMutation({
    mutationFn: (submission: ReportSubmission) => services.reports.submitReport(submission),
    networkMode: env.authMode === 'supabase' ? 'online' : networkMode,
    // A POST may have persisted even if its response was lost. Never auto-retry.
    retry: false,
  })
}

export function useTranscribeVoice() {
  return useMutation({
    mutationFn: (input?: { audio: Blob; signal: AbortSignal }) => services.reports.transcribeVoice(input?.audio, input?.signal),
    // Fail visibly when offline instead of queuing a later audio upload.
    networkMode: 'always',
    retry: false,
    gcTime: 0,
  })
}
