import { z } from 'zod';

// Confirmed creation contract, plus separate UI-only demo analysis models.

export const incidentCategories = [
  'verbal_harassment',
  'following',
  'physical_assault',
  'theft',
  'unsafe_conditions',
  'transport_issue',
  'other',
] as const;
export const incidentCategorySchema = z.enum(incidentCategories);
export type IncidentCategory = z.infer<typeof incidentCategorySchema>;

// `unknown` means "not enough information", never "low".
export const severityLevels = ['low', 'moderate', 'high', 'unknown'] as const;
export type SeverityLevel = (typeof severityLevels)[number];

export const confidenceLevels = ['low', 'medium', 'high'] as const;
export type ConfidenceLevel = (typeof confidenceLevels)[number];

export const reportedTimePeriods = ['morning', 'afternoon', 'evening', 'night', 'late_night', 'not_sure'] as const;
export type ReportedTimePeriod = (typeof reportedTimePeriods)[number];
export const reportedTimeSchema = z.union([
  z.enum(reportedTimePeriods),
  z.string().regex(/^(?:(?:[01]\d|2[0-3]):[0-5]\d|(?:0?[1-9]|1[0-2])(?::[0-5]\d)? (?:AM|PM))$/),
]);

export const lightingConditions = ['WELL_LIT', 'PARTIALLY_LIT', 'POORLY_LIT_OR_DARK', 'DAYLIGHT', 'UNKNOWN_OR_PREFER_NOT_TO_SAY'] as const;
export type LightingCondition = (typeof lightingConditions)[number];
export const currentSafetyStatuses = ['SAFE_NOW', 'UNSURE', 'MAY_STILL_BE_IN_DANGER', 'PREFER_NOT_TO_SAY'] as const;
export type CurrentSafetyStatus = (typeof currentSafetyStatuses)[number];

export const DESCRIPTION_MIN_LENGTH = 1;
export const DESCRIPTION_MAX_LENGTH = 5000;
export const originalTextSchema = z.string().min(DESCRIPTION_MIN_LENGTH).max(DESCRIPTION_MAX_LENGTH)
  .refine((text) => text.trim().length > 0, 'Describe what happened.');
export const occurredAtSchema = z.iso.datetime({ offset: true });

export const reportLanguageHints = ['si', 'si-Latn', 'en', 'ta', 'mixed', 'unknown'] as const;
export const reportLanguageHintSchema = z.enum(reportLanguageHints);
export type ReportLanguageHint = z.infer<typeof reportLanguageHintSchema>;

// Explicit { latitude, longitude } at UI boundaries. Always approximate (rounded), never a precise point.
export const approximateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  source: z.enum(['device', 'district']),
  districtId: z.string().optional(),
});
export type ApproximateLocation = z.infer<typeof approximateLocationSchema>;

// Local form shape. Typed input is mapped to the backend's `text` value at the boundary.
export const reportSubmissionSchema = z.strictObject({
  description: originalTextSchema,
  inputMethod: z.enum(['typed', 'voice']),
  language_hint: reportLanguageHintSchema,
  reported_time: reportedTimeSchema.nullable().optional(),
  occurred_at: occurredAtSchema.nullable().optional(),
  location: approximateLocationSchema.optional(),
  lighting_condition: z.enum(lightingConditions).nullable().optional(),
  current_safety_status: z.enum(currentSafetyStatuses).nullable().optional(),
});
export type ReportSubmission = z.infer<typeof reportSubmissionSchema>;

const reportContextShape = {
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  occurred_at: occurredAtSchema.nullable().optional(),
  lighting_condition: z.enum(lightingConditions).nullable().optional(),
  reported_time: reportedTimeSchema.nullable().optional(),
  current_safety_status: z.enum(currentSafetyStatuses).nullable().optional(),
};

function coordinatesArePaired(value: { latitude?: number | null; longitude?: number | null }) {
  return (value.latitude === undefined && value.longitude === undefined)
    || (value.latitude === null && value.longitude === null)
    || (typeof value.latitude === 'number' && typeof value.longitude === 'number');
}
const coordinateError = { message: 'Supply both coordinates together, or both null.', path: ['latitude'] };
const reportCoreShape = {
  original_text: originalTextSchema,
  input_method: z.enum(['text', 'voice']),
  language_hint: reportLanguageHintSchema,
};

// Strict requests reject removed/unsupported fields instead of silently forwarding them.
export const reportRequestSchema = z.strictObject({
  ...reportCoreShape,
  ...reportContextShape,
  translated_text: z.string().nullable().optional(),
}).refine(coordinatesArePaired, coordinateError);
export type ReportRequest = z.infer<typeof reportRequestSchema>;

// Flat HTTP 201 body. Ignore extra server metadata; creation confirmation must
// not depend on the presence or outcome of automatic analysis.
export const reportResponseSchema = z.object({
  ...reportCoreShape,
  ...reportContextShape,
  id: z.uuid(),
  submitted_at: z.iso.datetime({ offset: true }),
  translated_text: z.string().nullable(),
  RAPID_SUBMISSIONS: z.boolean(),
}).refine(coordinatesArePaired, coordinateError);
export type ReportResponse = z.infer<typeof reportResponseSchema>;

export const extractedDetailKinds = ['place', 'vehicle', 'behaviour'] as const;
export const missingInformationKinds = ['time', 'location', 'people'] as const;

// The AI's interpretation. Always an estimate; kept separate from the user's original words.
export const incidentAnalysisSchema = z.object({
  category: incidentCategorySchema,
  severity: z.enum(severityLevels),
  confidence: z.enum(confidenceLevels),
  extractedDetails: z.array(z.object({
    kind: z.enum(extractedDetailKinds),
    value: z.string(),
  })),
  missingInformation: z.array(z.enum(missingInformationKinds)),
});
export type IncidentAnalysis = z.infer<typeof incidentAnalysisSchema>;

export const reportReceiptSchema = z.object({
  report: reportResponseSchema,
  // Local demo output only; never assumed to be part of the creation response.
  demoAnalysis: incidentAnalysisSchema.optional(),
});
export type ReportReceipt = z.infer<typeof reportReceiptSchema>;

export interface VoiceTranscript {
  text: string;
}

// Raw-audio transcription returns a reviewable draft, never a saved report.
export const transcriptionResponseSchema = z.strictObject({
  transcript: originalTextSchema,
  requested_language_hint: reportLanguageHintSchema,
  review_required: z.literal(true).default(true),
});

export interface ReportService {
  submitReport(submission: ReportSubmission): Promise<ReportReceipt>;
  // Audio is optional only for the existing demo adapter. Real transcription requires PCM WAV.
  transcribeVoice(audio?: Blob, signal?: AbortSignal): Promise<VoiceTranscript>;
}
