import { createContext, useContext } from 'react'

import type {
  ApproximateLocation,
  CurrentSafetyStatus,
  LightingCondition,
  ReportedTimePeriod,
  ReportReceipt,
  ReportSubmission,
} from '../../services/contracts'
import { detectReportLanguage } from './detectReportLanguage'

export interface ReportDraft {
  description: string
  inputMethod: 'typed' | 'voice'
  // True while a voice transcript has not yet been confirmed by the user.
  transcriptPending: boolean
  reportedTime?: ReportedTimePeriod
  // datetime-local input in the user's device zone; serialized separately as ISO UTC.
  occurredAt?: string
  location?: ApproximateLocation
  lighting?: LightingCondition
  currentSafetyStatus?: CurrentSafetyStatus
}

export const emptyDraft: ReportDraft = { description: '', inputMethod: 'typed', transcriptPending: false }

export interface ReportDraftContextValue {
  draft: ReportDraft
  update: (patch: Partial<ReportDraft>) => void
  receipt: ReportReceipt | undefined
  setReceipt: (receipt: ReportReceipt | undefined) => void
  reset: () => void
}

export const ReportDraftContext = createContext<ReportDraftContextValue | undefined>(undefined)

export function useReportDraft(): ReportDraftContextValue {
  const value = useContext(ReportDraftContext)
  if (!value) throw new Error('useReportDraft must be used inside ReportDraftProvider')
  return value
}

export function toSubmission(draft: ReportDraft): ReportSubmission {
  const occurredAt = draft.occurredAt ? new Date(draft.occurredAt) : undefined
  return {
    description: draft.description,
    inputMethod: draft.inputMethod,
    // Derive from the latest reviewed text; never persist a potentially stale hint.
    language_hint: detectReportLanguage(draft.description),
    reported_time: draft.reportedTime,
    occurred_at: occurredAt && !Number.isNaN(occurredAt.getTime()) ? occurredAt.toISOString() : draft.occurredAt,
    location: draft.location,
    lighting_condition: draft.lighting,
    current_safety_status: draft.currentSafetyStatus,
  }
}
