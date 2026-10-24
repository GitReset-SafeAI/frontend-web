import type { HotspotService } from './hotspots'
import type { ReportService } from './incident'

export type { DataConfidence, Hotspot, HotspotActivity, HotspotService } from './hotspots'
export type {
  ApproximateLocation,
  ConfidenceLevel,
  CrowdLevel,
  IncidentAnalysis,
  IncidentCategory,
  IncidentTime,
  LightingLevel,
  NearbyAnswer,
  ReportReceipt,
  ReportService,
  ReportSubmission,
  SeverityLevel,
  VoiceTranscript,
} from './incident'

export interface AppServices {
  reports: ReportService
  hotspots: HotspotService
}
