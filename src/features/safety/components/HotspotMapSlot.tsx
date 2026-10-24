import { MapPinned } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { Hotspot } from '../../../services/contracts'

/**
 * Integration point for the interactive map (built separately).
 *
 * Replace the body of this component, keeping the props:
 *  - `hotspots`   privacy-protected aggregates (coarse centre + radius, counts, no private text).
 *  - `selectedId` the hotspot currently highlighted in the list/summary, if any.
 *  - `onSelect`   call with a hotspot id when a marker/area is chosen; `onDeselect` for a click on empty map.
 *
 * Contract reminders from the product spec:
 *  - Colour areas with `tokens` --color-activity-* (light to dark purple), never red/green.
 *  - "insufficient" areas are drawn dashed/empty; never imply a quiet area is safe.
 *  - Coordinates are `{ latitude, longitude }`; convert explicitly if a library wants [lng, lat].
 *  - Keep a text alternative: the list view is the accessible fallback (see SafetyPage).
 */
export interface HotspotMapSlotProps {
  hotspots: Hotspot[]
  selectedId?: string
  onSelect: (id: string) => void
  onDeselect: () => void
}

export function HotspotMapSlot({ hotspots }: HotspotMapSlotProps) {
  const { t } = useTranslation('web')
  return (
    <section
      aria-label={t('map.slotTitle')}
      data-testid="map-slot"
      className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-ink-muted bg-tint-soft p-6 text-center lg:min-h-[32rem]"
    >
      <MapPinned className="size-12 text-primary-dark" aria-hidden />
      <h2 className="text-xl font-semibold">{t('map.slotTitle')}</h2>
      <p className="m-0 max-w-sm text-ink-muted">{t('map.slotBody')}</p>
      <p className="m-0 text-sm font-medium text-ink-muted">{t('map.slotCount', { count: hotspots.length })}</p>
    </section>
  )
}
