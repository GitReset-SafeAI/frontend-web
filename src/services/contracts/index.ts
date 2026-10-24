import type { AuthService, ContactService } from './account'
import type { JourneyService } from './journeys'
import type { ReportService } from './incident'
import type { PlacesService } from './places'
import type { SafetyMapService } from './safetyMap'

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

export type {
  JourneyService,
  JourneyShare,
  JourneyStatus,
  SharedJourney,
  StartJourneyRequest,
} from './journeys'

export type { PlaceSearchRequest, PlacesService, PlaceSuggestion } from './places'

// The safety map speaks the backend's own vocabulary. Still exported as
// SafetyMapHotspot so the name says which contract it belongs to.
export type {
  BoundingBox,
  Coordinate,
  EvidenceLevel,
  Hotspot as SafetyMapHotspot,
  HotspotsRequest,
  HotspotsResult,
  Route,
  RouteComparisonRequest,
  RouteComparisonResult,
  RouteRole,
  SafetyMapService,
  TimePeriod,
  TimePeriodFilter,
  TravelMode,
} from './safetyMap'

export interface AppServices {
  reports: ReportService
  auth: AuthService
  contacts: ContactService
  places: PlacesService
  safetyMap: SafetyMapService
  journeys: JourneyService
}
