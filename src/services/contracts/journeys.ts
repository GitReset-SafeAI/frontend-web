import { z } from 'zod'

import { coordinateSchema } from './safetyMap'

// A journey in progress, shared with someone the traveller chose. The share
// link carries a live position, so what crosses this boundary is kept to what a
// viewer needs to follow along: no reporter, no report, no account.

export const journeyStatusSchema = z.enum(['active', 'arrived', 'ended'])
export type JourneyStatus = z.infer<typeof journeyStatusSchema>

const shareWireSchema = z.object({
  share_id: z.string().min(1),
  // Held only by the traveller: a forwarded link cannot move or stop the dot.
  owner_key: z.string().min(1),
  expires_at: z.string().min(1),
})

export const journeyShareSchema = shareWireSchema.transform((share) => ({
  shareId: share.share_id,
  ownerKey: share.owner_key,
  expiresAt: share.expires_at,
}))

export type JourneyShare = z.infer<typeof journeyShareSchema>

const sharedJourneyWireSchema = z.object({
  share_id: z.string().min(1),
  status: journeyStatusSchema,
  origin: coordinateSchema,
  destination: coordinateSchema,
  origin_label: z.string(),
  destination_label: z.string(),
  geometry: z.array(coordinateSchema).min(2),
  duration_s: z.number().int().min(0),
  position: coordinateSchema.nullable(),
  // Reported GPS accuracy in metres, shown so a wide fix is not read as a
  // precise one.
  accuracy_m: z.number().nullable(),
  started_at: z.string().min(1),
  updated_at: z.string().nullable(),
  expires_at: z.string().min(1),
})

export const sharedJourneySchema = sharedJourneyWireSchema.transform((journey) => ({
  shareId: journey.share_id,
  status: journey.status,
  origin: journey.origin,
  destination: journey.destination,
  originLabel: journey.origin_label,
  destinationLabel: journey.destination_label,
  geometry: journey.geometry,
  durationSeconds: journey.duration_s,
  position: journey.position,
  accuracyMeters: journey.accuracy_m,
  startedAt: journey.started_at,
  updatedAt: journey.updated_at,
  expiresAt: journey.expires_at,
}))

export type SharedJourney = z.infer<typeof sharedJourneySchema>

export interface StartJourneyRequest {
  origin: { latitude: number; longitude: number }
  destination: { latitude: number; longitude: number }
  originLabel: string
  destinationLabel: string
  geometry: { latitude: number; longitude: number }[]
  durationSeconds: number
}

export interface JourneyService {
  start(request: StartJourneyRequest): Promise<JourneyShare>
  updatePosition(
    shareId: string,
    ownerKey: string,
    position: { latitude: number; longitude: number },
    accuracyMeters: number | null,
  ): Promise<SharedJourney>
  read(shareId: string): Promise<SharedJourney>
  end(shareId: string, ownerKey: string): Promise<void>
}
