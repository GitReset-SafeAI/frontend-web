import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'

import { emergencyNumbers, SOS_COUNTDOWN_SECONDS } from '../emergencyNumbers'

interface SosButtonProps {
  onPress: () => void
}

// The one dominant control on the emergency page. Concentric rings make it unmistakable
// without animation or clutter. Size scales with the viewport via one CSS variable.
export function SosButton({ onPress }: SosButtonProps) {
  const { t } = useTranslation('emergency')
  const style = { '--size': 'clamp(11rem, 46vw, 17.5rem)' } as CSSProperties

  return (
    <div
      style={style}
      className="grid size-[calc(var(--size)*1.42)] place-items-center rounded-full bg-sos-ring-outer"
    >
      <div className="grid size-[calc(var(--size)*1.18)] place-items-center rounded-full bg-sos-ring-inner">
        <button
          type="button"
          onClick={onPress}
          aria-label={t('sosA11yLabel')}
          aria-description={t('sosA11yHint', { seconds: SOS_COUNTDOWN_SECONDS, number: emergencyNumbers.police })}
          style={{ fontSize: 'calc(var(--size) * 0.3)' }}
          className="grid size-(--size) place-items-center rounded-full bg-sos font-extrabold tracking-[0.1em] text-white shadow-[0_8px_16px_rgb(166_37_50/0.35)] transition-transform hover:bg-sos-pressed active:scale-[0.97] active:bg-sos-pressed"
        >
          {t('sosLabel')}
        </button>
      </div>
    </div>
  )
}
