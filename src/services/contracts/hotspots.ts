import { z } from 'zod';

import { incidentCategorySchema } from './incident';

// Provisional, privacy-protected aggregate. No private text, identifiers, or precise coordinates.
// `activity` describes the amount of reported activity, never how dangerous a place is.
export const hotspotActivityLevels = ['insufficient', 'low', 'moderate', 'high'] as const;
export type HotspotActivity = (typeof hotspotActivityLevels)[number];

export const dataConfidenceLevels = ['limited', 'moderate', 'good'] as const;
export type DataConfidence = (typeof dataConfidenceLevels)[number];

export const hotspotSchema = z.object({
  id: z.string(),
  areaName: z.string(),
  center: z.object({ latitude: z.number(), longitude: z.number() }),
  radiusMeters: z.number().positive(),
  reportCount: z.number().int().nonnegative(),
  windowDays: z.number().int().positive(),
  lastReportDaysAgo: z.number().int().nonnegative(),
  activity: z.enum(hotspotActivityLevels),
  dataConfidence: z.enum(dataConfidenceLevels),
  categoryCounts: z.array(z.object({
    category: incidentCategorySchema,
    count: z.number().int().positive(),
  })),
});
export type Hotspot = z.infer<typeof hotspotSchema>;

export interface HotspotService {
  listHotspots(): Promise<Hotspot[]>;
}
