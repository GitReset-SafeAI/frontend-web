import { useSyncExternalStore } from 'react'

// The road centre line, and the route that follows it to the pin (which stands on the road at 1053,81).
const ROAD = 'M-40 130 C 160 150 280 40 500 70 S 800 170 1000 100 S 1160 30 1260 50'
const ROUTE = 'M-40 130 C 160 150 280 40 500 70 S 800 170 1000 100 L 1053 81'

const reducedMotionQuery = '(prefers-reduced-motion: reduce)'

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia?.(reducedMotionQuery)
      media?.addEventListener('change', onChange)
      return () => { media?.removeEventListener('change', onChange) }
    },
    () => window.matchMedia?.(reducedMotionQuery).matches ?? false,
    () => false,
  )
}

interface RoadArtProps {
  className?: string
  // Animate a coral route down the middle of the road: it draws itself, flows forward, and a traveller
  // walks it to the pin. With "reduce motion" the route is a still line and the traveller is omitted.
  animated?: boolean
}

// Decorative winding road, echoing the S-shaped road in the logo: a navy road, a mint road beside it, and
// a coral pin at the destination. Purely ornamental, so hidden from assistive tech.
export function RoadArt({ className = '', animated = false }: RoadArtProps) {
  const reducedMotion = usePrefersReducedMotion()

  return (
    <svg
      viewBox="0 0 1200 260"
      fill="none"
      preserveAspectRatio="xMaxYMax slice"
      className={className}
      style={{ overflow: 'visible' }}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M-40 205 C 200 225 300 125 520 145 S 820 245 1000 175 S 1160 95 1260 115"
        style={{ stroke: 'var(--color-mint)' }}
        strokeWidth="56"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path d={ROAD} style={{ stroke: 'var(--color-navy)' }} strokeWidth="38" strokeLinecap="round" />

      {animated ? (
        <>
          {/* The route, drawn on once. pathLength=1 lets CSS animate it regardless of the real length. */}
          <path
            d={ROUTE}
            pathLength={1}
            className="route-draw"
            style={{ stroke: 'var(--color-coral)' }}
            strokeWidth="7"
            strokeLinecap="round"
          />
          {/* Pale dots flowing along it, always heading toward the pin. */}
          <path
            d={ROUTE}
            className="route-flow"
            style={{ stroke: 'var(--color-screen)' }}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="1 16"
            opacity="0.9"
          />
        </>
      ) : (
        <path
          d={ROAD}
          style={{ stroke: 'var(--color-screen)' }}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="1 20"
          opacity="0.8"
        />
      )}

      <g transform="translate(1053 22) scale(0.9)">
        <path
          d="M0 66 C -26 34 -36 18 -36 0 a36 36 0 1 1 72 0 c0 18 -10 34 -36 66 z"
          style={{ fill: 'var(--color-coral)' }}
        />
        <circle cx="0" cy="0" r="12" style={{ fill: 'var(--color-screen)' }} />
      </g>

      {/* The traveller: appears once the route has been drawn, then walks it again and again. */}
      {animated && !reducedMotion ? (
        <g opacity="0">
          <set attributeName="opacity" to="1" begin="2.4s" fill="freeze" />
          <circle r="12" style={{ fill: 'var(--color-coral)' }} opacity="0.4">
            <animate attributeName="r" values="12;28" dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.45;0" dur="1.6s" repeatCount="indefinite" />
          </circle>
          <circle r="12" style={{ fill: 'var(--color-coral)', stroke: 'var(--color-screen)' }} strokeWidth="4" />
          <animateMotion path={ROUTE} begin="2.4s" dur="9s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1" keyTimes="0;1" />
        </g>
      ) : null}
    </svg>
  )
}
