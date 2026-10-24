import type { AuthService, ContactService } from './account'
import type { HotspotService } from './hotspots'
import type { ReportService } from './incident'

export type {
  AuthService,
  ContactInput,
  ContactRelationship,
  ContactService,
  EmergencyContact,
  LogInInput,
  SignUpInput,
  User,
} from './account'
export type { DataConfidence, Hotspot, HotspotActivity, HotspotService } from './hotspots'
export type {
  ApproximateLocation,
  ConfidenceLevel,
  CurrentSafetyStatus,
  IncidentAnalysis,
  IncidentCategory,
  LightingCondition,
  ReportLanguageHint,
  ReportReceipt,
  ReportRequest,
  ReportResponse,
  ReportedTimePeriod,
  ReportService,
  ReportSubmission,
  SeverityLevel,
  VoiceTranscript,
} from './incident'

export interface AppServices {
  reports: ReportService
  hotspots: HotspotService
  auth: AuthService
  contacts: ContactService
}
