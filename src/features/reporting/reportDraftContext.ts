import { createContext, useContext } from 'react'

import type {
  ApproximateLocation,
  CrowdLevel,
  IncidentTime,
  LightingLevel,
  NearbyAnswer,
  ReportReceipt,
  ReportSubmission,
} from '../../services/contracts'

export interface ReportDraft {
  description: string
  inputMethod: 'typed' | 'voice'
  // True while a voice transcript has not yet been confirmed by the user.
  transcriptPending: boolean
  occurredWhen?: IncidentTime
  location?: ApproximateLocation
  lighting?: LightingLevel
  crowd?: CrowdLevel
  othersNearby?: NearbyAnswer
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
  return {
    description: draft.description,
    inputMethod: draft.inputMethod,
    occurredWhen: draft.occurredWhen,
    location: draft.location,
    lighting: draft.lighting,
    crowd: draft.crowd,
    othersNearby: draft.othersNearby,
  }
}
