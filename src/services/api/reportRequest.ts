import { reportRequestSchema, reportSubmissionSchema, type ReportRequest, type ReportSubmission } from '../contracts/incident'

export { reportRequestSchema } from '../contracts/incident'
export type { ReportRequest } from '../contracts/incident'

export const reportRequestPath = '/api/v1/reports'

export function toReportRequest(submission: ReportSubmission): ReportRequest {
  const parsed = reportSubmissionSchema.parse(submission)
  return reportRequestSchema.parse({
    original_text: parsed.description,
    input_method: parsed.inputMethod === 'voice' ? 'voice' : 'text',
    language_hint: parsed.language_hint,
    latitude: parsed.location?.latitude,
    longitude: parsed.location?.longitude,
    occurred_at: parsed.occurred_at ?? undefined,
    reported_time: parsed.reported_time ?? undefined,
    lighting_condition: parsed.lighting_condition ?? undefined,
    current_safety_status: parsed.current_safety_status ?? undefined,
  })
}
