import { ChevronDown, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

// Mobile keeps this folded at the foot of the screen: the heading carries the
// caveat on its own, and the route card states its own limits where a route is
// actually chosen. Nothing here may read as a safety guarantee.
export function EstimateLimitsNote() {
  const { t } = useTranslation('safety')
  const [open, setOpen] = useState(false)

  return (
    <section className="overflow-hidden rounded-lg border border-line/70 bg-surface shadow-card">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => { setOpen((value) => !value) }}
        className="flex w-full items-center gap-3 p-5 text-left hover:bg-mint-soft/60"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-mint-light text-navy">
          <ShieldAlert className="size-5" aria-hidden />
        </span>
        <span className="flex-1 font-sans text-base font-semibold text-ink">{t('estimateTitle')}</span>
        <ChevronDown aria-hidden className={`size-5 shrink-0 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <p className="m-0 px-5 pb-5 pl-[4.5rem] text-ink-muted">{t('estimateDescription')}</p>
      ) : null}
    </section>
  )
}
