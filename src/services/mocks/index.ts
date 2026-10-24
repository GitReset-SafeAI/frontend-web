import type { AppServices, HotspotsRequest, HotspotsResult } from '../contracts'
import { ApiError } from '../api/ApiError'
import { mockAuth, mockContacts } from './accounts'
import { analyseSyntheticReport, sampleTranscript } from './fixtures/analysis'
import { sampleHotspots } from './fixtures/hotspots'
import { toReportRequest } from '../api/reportRequest'

// Simulated latency makes loading and processing states visible in demos. Tests skip it.
const mockLatencyMs = import.meta.env.MODE === 'test' ? 0 : 1200
const wait = (ms: number) => new Promise<void>((resolve) => { setTimeout(resolve, ms) })

function withinBounds({ bounds }: HotspotsRequest, hotspot: HotspotsResult['hotspots'][number]) {
  const { southWest, northEast } = bounds
  return (
    hotspot.center.latitude >= southWest.latitude &&
    hotspot.center.latitude <= northEast.latitude &&
    hotspot.center.longitude >= southWest.longitude &&
    hotspot.center.longitude <= northEast.longitude
  )
}

function matchesTimePeriod(
  hotspot: HotspotsResult['hotspots'][number],
  timePeriod: HotspotsRequest['timePeriod'],
) {
  return timePeriod === 'all' || hotspot.peakTimePeriod === null || hotspot.peakTimePeriod === timePeriod
}

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
  // Journeys are shared through the backend: a position that only this browser
  // knows about is not a share. Mock mode says so rather than pretending.
  journeys: {
    async start() { throw new ApiError('not-implemented', 'Sharing a journey needs the backend. Set VITE_DATA_MODE=api.') },
    async updatePosition() { throw new ApiError('not-implemented', 'Sharing a journey needs the backend.') },
    async read() { throw new ApiError('not-implemented', 'Sharing a journey needs the backend.') },
    async end() { /* nothing was ever shared */ },
  },
  places: {
    async searchPlaces({ query, limit = 6 }) {
      return searchDemoPlaces(query, limit)
    },
  },
  safetyMap: {
    async getHotspots(request) {
      // Mirrors the server filters so the map behaves the same in both modes.
      const hotspots = demoHotspots.hotspots.filter(
        (hotspot) => withinBounds(request, hotspot) && matchesTimePeriod(hotspot, request.timePeriod),
      )
      return {
        ...demoHotspots,
        windowDays: request.windowDays ?? demoHotspots.windowDays,
        hotspots,
        evidenceLevel: hotspots.length === 0 ? 'insufficient' : demoHotspots.evidenceLevel,
      }
    },
    async compareRoutes(request) {
      const hotspots = demoHotspots.hotspots.filter((hotspot) =>
        matchesTimePeriod(hotspot, request.timePeriod),
      )
      return buildSyntheticComparison(
        request.origin,
        request.destination,
        hotspots,
        hotspots.length === 0 ? 'insufficient' : demoHotspots.evidenceLevel,
        request.travelMode,
      )
    },
  },
}
