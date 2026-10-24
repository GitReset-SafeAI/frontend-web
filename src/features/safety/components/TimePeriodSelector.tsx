import { Check } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import type { TimePeriodFilter } from '../../../services/contracts'

interface TimePeriodSelectorProps {
  value: TimePeriodFilter
  // The period the device clock is in, marked so the default is not mistaken
  // for an arbitrary choice.
  currentPeriod: TimePeriodFilter
  onChange: (value: TimePeriodFilter) => void
}

// The reported_time vocabulary has six values plus "any", too many for a
// segmented control, so these wrap as a filter row.
const periods: TimePeriodFilter[] = [
  'all', 'morning', 'afternoon', 'evening', 'night', 'late_night', 'not_sure',
]

export function TimePeriodSelector({ value, currentPeriod, onChange }: TimePeriodSelectorProps) {
  const { t } = useTranslation('safety')
  const labelId = useId()

  return (
    <div className="flex flex-col gap-2">
      <h2 id={labelId} className="m-0 font-sans text-base font-semibold tracking-normal text-ink">
        {t('timePeriod.label')}
      </h2>
      <p className="m-0 text-sm text-ink-muted">
        {t('timePeriod.defaultedToNow', { period: t(`timePeriod.${currentPeriod}`) })}
      </p>
      <div role="radiogroup" aria-labelledby={labelId} className="flex flex-wrap gap-2">
        {periods.map((period) => {
          const selected = value === period
          return (
            <button
              key={period}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => { onChange(period) }}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-ink transition-all ${
                selected
                  ? 'border-2 border-navy bg-mint-light shadow-card'
                  : 'border border-ink-muted/60 bg-surface hover:border-navy hover:bg-mint-soft'
              }`}
            >
              {/* Selection is shown by an icon and a heavier border, never by colour alone. */}
              {selected ? <Check className="size-4" aria-hidden /> : null}
              {period === currentPeriod
                ? t('timePeriod.nowLabel', { period: t(`timePeriod.${period}`) })
                : t(`timePeriod.${period}`)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
