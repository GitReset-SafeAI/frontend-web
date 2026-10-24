import type { AppServices } from '../contracts'
import { mockAuth, mockContacts } from './accounts'
import { analyseSyntheticReport, sampleTranscript } from './fixtures/analysis'
import { sampleHotspots } from './fixtures/hotspots'
import { toReportRequest } from '../api/reportRequest'

// Simulated latency makes loading and processing states visible in demos. Tests skip it.
const mockLatencyMs = import.meta.env.MODE === 'test' ? 0 : 1200
const wait = (ms: number) => new Promise<void>((resolve) => { setTimeout(resolve, ms) })

export const mockServices: AppServices = {
  auth: mockAuth,
  contacts: mockContacts,
  reports: {
    async submitReport(submission) {
      await wait(mockLatencyMs)
      return {
        report: {
          ...toReportRequest(submission),
          id: crypto.randomUUID(),
          submitted_at: new Date().toISOString(),
          translated_text: null,
          // Synthetic demo review signal.
          RAPID_SUBMISSIONS: false,
        },
        demoAnalysis: analyseSyntheticReport(submission),
      }
    },
    async transcribeVoice() {
      await wait(mockLatencyMs)
      return { text: sampleTranscript }
    },
  },
  hotspots: {
    async listHotspots() {
      await wait(mockLatencyMs / 2)
      return sampleHotspots.map((hotspot) => ({
        ...hotspot,
        center: { ...hotspot.center },
        categoryCounts: hotspot.categoryCounts.map((entry) => ({ ...entry })),
      }))
    },
  },
}
