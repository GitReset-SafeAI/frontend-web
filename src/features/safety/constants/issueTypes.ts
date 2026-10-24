import {
  AlertTriangle,
  BusFront,
  Eye,
  Footprints,
  Hand,
  HelpCircle,
  History,
  Info,
  LightbulbOff,
  MapPinned,
  MessageSquareWarning,
  Milestone,
  UserRoundSearch,
  type LucideIcon,
} from 'lucide-react'

import type { Route, SafetyMapHotspot } from '../../../services/contracts'

// Display metadata for the incident-AI vocabularies
// (`incident_ai_analyses.IncidentCategory` and `SafetyConcernCategory`).
// OTHER and UNCLEAR exist in both enums, so the two are kept apart. An
// unrecognised code must degrade to a neutral label rather than break or be
// dropped silently.

export interface IssueDisplay {
  key: string
  Icon: LucideIcon
  color: string
  labelKey: string
}

type DisplayMeta = Omit<IssueDisplay, 'key' | 'labelKey'>

const incidentCategories: Record<string, DisplayMeta> = {
  UNWANTED_FOLLOWING: { Icon: Footprints, color: 'text-danger' },
  VERBAL_SEXUAL_HARASSMENT: { Icon: MessageSquareWarning, color: 'text-danger' },
  UNWANTED_PHYSICAL_CONTACT: { Icon: Hand, color: 'text-danger' },
  THREATENING_BEHAVIOUR: { Icon: AlertTriangle, color: 'text-danger' },
  UNCOMFORTABLE_STARING: { Icon: Eye, color: 'text-warning' },
  OTHER: { Icon: MapPinned, color: 'text-warning' },
  UNCLEAR: { Icon: HelpCircle, color: 'text-unknown' },
}

const safetyConcerns: Record<string, DisplayMeta> = {
  POOR_STREET_LIGHTING: { Icon: LightbulbOff, color: 'text-info' },
  ISOLATED_OR_DESERTED_ROAD: { Icon: Milestone, color: 'text-info' },
  UNSAFE_BUS_STOP: { Icon: BusFront, color: 'text-info' },
  FEELING_UNSAFE_WITHOUT_CONFIRMED_INCIDENT: { Icon: UserRoundSearch, color: 'text-unknown' },
  PREVIOUS_SAFETY_CONCERNS_AT_LOCATION: { Icon: History, color: 'text-unknown' },
  OTHER: { Icon: Info, color: 'text-unknown' },
  UNCLEAR: { Icon: HelpCircle, color: 'text-unknown' },
}

const unknownMeta: DisplayMeta = { Icon: MapPinned, color: 'text-unknown' }

function toDisplay(
  kind: 'incident' | 'concern',
  code: string,
  table: Record<string, DisplayMeta>,
): IssueDisplay {
  const known = table[code] !== undefined
  return {
    key: `${kind}:${code}`,
    ...(table[code] ?? unknownMeta),
    labelKey: known ? `issues.${kind}.${code}` : `issues.${kind}.UNKNOWN`,
  }
}

export function incidentCategoryDisplay(code: string) {
  return toDisplay('incident', code, incidentCategories)
}

export function safetyConcernDisplay(code: string) {
  return toDisplay('concern', code, safetyConcerns)
}

// Reported incidents are listed before contextual concerns so the more serious
// signal is read first.
export function hotspotIssues(hotspot: SafetyMapHotspot): IssueDisplay[] {
  return [
    ...hotspot.topIncidentCategories.map(incidentCategoryDisplay),
    ...hotspot.topSafetyConcerns.map(safetyConcernDisplay),
  ]
}

export function routeIssues(route: Route): IssueDisplay[] {
  return [
    ...route.incidentCategories.map(incidentCategoryDisplay),
    ...route.safetyConcerns.map(safetyConcernDisplay),
  ]
}

// Reported as a band, not a percentage: a mean of AI confidence scores does not
// justify two-decimal precision in the interface.
export function confidenceLabelKey(meanConfidence: number) {
  if (meanConfidence >= 0.75) return 'map.confidence.high'
  if (meanConfidence >= 0.5) return 'map.confidence.moderate'
  return 'map.confidence.low'
}

const ACTIVITY_NAVY = '#133148'

// The backend combines severity, confidence, recency and incident count, then
// normalises against the highest area in this query. This is not raw severity.
export const intensityBands = ['lower', 'moderate', 'higher', 'highest'] as const
export type IntensityBand = (typeof intensityBands)[number]
const intensityColors: Record<IntensityBand, string> = {
  lower: '#fdba74', moderate: '#f97316', higher: '#dc2626', highest: '#991b1b',
}

export function intensityBand(intensity: number): IntensityBand {
  const value = Number.isFinite(intensity) ? Math.min(1, Math.max(0, intensity)) : 0
  return intensityBands[Math.min(3, Math.floor(value * 4))]
}

export function hotspotColor(intensity: number) {
  return intensityColors[intensityBand(intensity)]
}

export function hotspotFill(intensity: number) {
  return `${hotspotColor(intensity)}66`
}

export const mapColors = {
  area: ACTIVITY_NAVY,
  routeSelected: ACTIVITY_NAVY,
  routeOther: '#a9b4bd',
  origin: '#245a89',
  destination: ACTIVITY_NAVY,
} as const
