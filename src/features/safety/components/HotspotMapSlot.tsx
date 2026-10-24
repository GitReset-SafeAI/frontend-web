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
 *  - Colour areas with the --color-activity-* tokens (pale to deep navy), never red/green.
 *  - "insufficient" areas are drawn dashed/empty; never imply a quiet area is safe.
 *  - Coordinates are `{ latitude, longitude }`; convert explicitly if a library wants [lng, lat].
 *  - Keep a text alternative: the list view is the accessible fallback (see SafetyPage).
 *
 * The placeholder below is an abstract base map with no data on it, on purpose: a stand-in must never look
 * like real incident data.
 */
export interface HotspotMapSlotProps {
  hotspots: Hotspot[]
  selectedId?: string
  onSelect: (id: string) => void
  onDeselect: () => void
}

function BaseMapArt() {
  const road = { stroke: 'var(--color-surface)', strokeLinecap: 'round' as const, fill: 'none' }
  const casing = { stroke: 'var(--color-line)', strokeLinecap: 'round' as const, fill: 'none' }
  return (
    <svg viewBox="0 0 600 520" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden="true" focusable="false">
      <rect width="600" height="520" style={{ fill: 'var(--color-mint-soft)' }} />
      {/* Sea along the west coast */}
      <path d="M0 0 H150 C118 110 188 200 148 300 S104 430 138 520 H0 Z" style={{ fill: 'var(--color-activity-low)' }} opacity="0.7" />
      {/* City blocks */}
      {[
        [210, 60, 90, 60], [330, 40, 120, 80], [480, 70, 90, 70], [220, 170, 70, 80], [320, 170, 110, 60],
        [470, 190, 100, 90], [230, 300, 100, 70], [360, 290, 80, 90], [480, 330, 90, 70], [250, 410, 120, 70], [410, 420, 140, 60],
      ].map(([x, y, w, h]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx="10" style={{ fill: 'var(--color-surface)' }} opacity="0.7" />
      ))}
      {/* Park */}
      <rect x="320" y="250" width="26" height="30" rx="8" style={{ fill: 'var(--color-mint)' }} opacity="0.55" />
      {/* Streets: casing first, then the road on top */}
      {['M160 0 C 190 140 230 230 200 330 S 190 470 230 520', 'M160 150 H600', 'M190 280 C 330 270 420 300 600 250', 'M300 0 C 310 160 340 330 320 520', 'M450 0 C 440 180 470 340 450 520', 'M180 400 C 330 380 470 410 600 380']
        .flatMap((d, i) => [
          <path key={`c${i}`} d={d} strokeWidth="15" {...casing} />,
          <path key={`r${i}`} d={d} strokeWidth="11" {...road} />,
        ])}
      {/* Railway */}
      <path d="M170 0 C 200 140 240 240 210 340 S 200 480 240 520" style={{ stroke: 'var(--color-navy)' }} strokeWidth="2.5" strokeDasharray="7 7" fill="none" opacity="0.4" />
    </svg>
  )
}

export function HotspotMapSlot({ hotspots }: HotspotMapSlotProps) {
  const { t } = useTranslation('web')
  return (
    <section
      aria-label={t('map.slotTitle')}
      data-testid="map-slot"
      className="relative grid min-h-[22rem] place-items-center overflow-hidden rounded-lg border border-line/70 p-6 shadow-card lg:min-h-[34rem]"
    >
      <BaseMapArt />
      <div className="relative flex max-w-xs flex-col items-center gap-2 rounded-lg bg-surface/95 p-6 text-center shadow-lift backdrop-blur">
        <span className="grid size-12 place-items-center rounded-full bg-mint-light text-navy">
          <MapPinned className="size-6" aria-hidden />
        </span>
        <h2 className="text-xl">{t('map.slotTitle')}</h2>
        <p className="m-0 text-sm text-ink-muted">{t('map.slotBody')}</p>
        <p className="m-0 rounded-full bg-mint-soft px-3 py-1 text-xs font-semibold text-navy">{t('map.slotCount', { count: hotspots.length })}</p>
      </div>
    </section>
  )
}
