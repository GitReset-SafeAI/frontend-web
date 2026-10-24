import type { HotspotActivity } from '../../../services/contracts'

// Navy ramp. "Insufficient" is white and dashed so a quiet area is never read as a reassuring colour.
export const swatchColor: Record<HotspotActivity, string> = {
  insufficient: 'bg-activity-insufficient border-dashed',
  low: 'bg-activity-low',
  moderate: 'bg-activity-moderate',
  high: 'bg-activity-high',
}
