import { Check } from 'lucide-react'
import { useId } from 'react'

export interface ChoiceOption<T extends string> {
  value: T
  label: string
}

interface ChoiceGroupProps<T extends string> {
  label: string
  options: readonly ChoiceOption<T>[]
  value: T | undefined
  // Selecting the chosen option again clears it, so optional answers are always reversible.
  onChange: (value: T | undefined) => void
}

export function ChoiceGroup<T extends string>({ label, options, value, onChange }: ChoiceGroupProps<T>) {
  const labelId = useId()
  return (
    <div className="flex flex-col gap-3">
      <h2 id={labelId} className="text-lg font-semibold text-ink">{label}</h2>
      <div role="radiogroup" aria-labelledby={labelId} className="flex flex-wrap gap-3">
        {options.map((option) => {
          const selected = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => { onChange(selected ? undefined : option.value) }}
              className={`inline-flex min-h-12 items-center gap-1.5 rounded-full px-5 text-[0.9375rem] font-medium text-ink transition-colors ${
                selected
                  ? 'border-2 border-primary-dark bg-tint'
                  : 'border border-ink-muted bg-surface hover:bg-tint-soft'
              }`}
            >
              {/* Selection is shown by an icon and a heavier border, never by colour alone. */}
              {selected ? <Check className="size-[18px]" aria-hidden /> : null}
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
