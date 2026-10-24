import { Check } from 'lucide-react'
import type { PropsWithChildren, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface StepLayoutProps extends PropsWithChildren {
  // 1-based position along the route. Omit for single screens.
  step?: { current: number; total: number }
  title: string
  subtitle?: string
  // Actions stay reachable: pinned above the tab bar on phones, inline in the card on larger screens.
  footer?: ReactNode
  // Reassurance shown beside the form on large screens.
  aside?: ReactNode
}

const stopKeys = ['describe', 'when', 'details', 'review'] as const

// The report is a short route with four stops. Done stops are ticked, the current stop is filled and
// ringed, and only the current label is shown on phones. Never colour alone: ticks, numbers and weight too.
function RouteProgress({ current, total }: { current: number; total: number }) {
  const { t } = useTranslation('reporting')
  const label = t('stepOf', { current, total })

  return (
    <ol className="m-0 flex list-none items-start p-0" aria-label={label}>
      {stopKeys.slice(0, total).map((key, index) => {
        const number = index + 1
        const done = number < current
        const active = number === current
        const last = number === total
        return (
          <li key={key} className={`relative flex ${last ? 'flex-none' : 'flex-1'} flex-col`} aria-current={active ? 'step' : undefined}>
            <div className="flex items-center">
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-full border-2 text-sm font-bold ${
                  active
                    ? 'border-navy bg-navy text-white ring-4 ring-mint-light'
                    : done
                      ? 'border-navy bg-mint text-navy'
                      : 'border-line bg-surface text-ink-muted'
                }`}
              >
                {done ? <Check className="size-4" aria-hidden /> : number}
              </span>
              {!last ? <span className={`mx-1 h-1 flex-1 rounded-full ${done ? 'bg-navy' : 'bg-line'}`} aria-hidden /> : null}
            </div>
            <span className={`mt-2 whitespace-nowrap text-xs font-semibold sm:text-sm ${active ? 'text-navy' : 'hidden text-ink-muted sm:block'}`}>
              {t(`stops.${key}`)}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export function StepLayout({ step, title, subtitle, footer, aside, children }: StepLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className={aside ? 'grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]' : 'mx-auto max-w-3xl'}>
        <div className="rounded-lg lg:border lg:border-line/70 lg:bg-surface lg:p-10 lg:shadow-card">
          <div className="flex flex-col gap-7">
            {step ? <RouteProgress current={step.current} total={step.total} /> : null}

            <div className="flex flex-col gap-3">
              <h1 className="display-lg">{title}</h1>
              {subtitle ? <p className="m-0 text-lg text-ink-muted">{subtitle}</p> : null}
            </div>

            {children}

            {footer ? (
              <div className="sticky bottom-[calc(6.5rem+env(safe-area-inset-bottom))] -mx-4 flex gap-3 border-t border-line/70 bg-screen/95 p-4 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none [&>*]:flex-1">
                {footer}
              </div>
            ) : null}
          </div>
        </div>

        {aside ? <aside className="hidden lg:sticky lg:top-24 lg:block">{aside}</aside> : null}
      </div>
    </div>
  )
}
