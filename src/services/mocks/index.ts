import type { AppServices } from '../contracts'
import { analyseSyntheticReport, sampleTranscript } from './fixtures/analysis'
import { sampleHotspots } from './fixtures/hotspots'

// Simulated latency makes loading and processing states visible in demos. Tests skip it.
const mockLatencyMs = import.meta.env.MODE === 'test' ? 0 : 1200
const wait = (ms: number) => new Promise<void>((resolve) => { setTimeout(resolve, ms) })

export const mockServices: AppServices = {
  reports: {
    async submitReport(submission) {
      await wait(mockLatencyMs)
      return {
        reportId: `mock-${Date.now().toString(36)}`,
        analysis: analyseSyntheticReport(submission),
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
