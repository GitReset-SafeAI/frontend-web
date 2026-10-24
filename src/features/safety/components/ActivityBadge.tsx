import { useTranslation } from 'react-i18next'

import type { HotspotActivity } from '../../../services/contracts'
import { swatchColor } from './activityStyles'

// Swatch + words. The swatch never carries the meaning alone, and "insufficient" is drawn dashed
// and empty so a quiet area is never read as a "safe" (green/filled) one.
export function ActivityBadge({ activity }: { activity: HotspotActivity }) {
  const { t } = useTranslation('safety')
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`size-4 shrink-0 rounded-full border border-ink-muted ${swatchColor[activity]}`} aria-hidden />
      <span className="text-sm font-semibold text-ink">{t(`levels.${activity}`)}</span>
    </span>
  )
}
