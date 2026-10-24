import type { PropsWithChildren, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface StepLayoutProps extends PropsWithChildren {
  // 1-based position in a multi-step flow. Omit for single screens.
  step?: { current: number; total: number }
  title: string
  subtitle?: string
  // Actions stay reachable: pinned above the tab bar on phones, inline on larger screens.
  footer?: ReactNode
}

export function StepLayout({ step, title, subtitle, footer, children }: StepLayoutProps) {
  const { t } = useTranslation('reporting')
  const stepLabel = step ? t('stepOf', { current: step.current, total: step.total }) : undefined

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-6">
        {step ? (
          <div role="group" aria-label={stepLabel} className="flex flex-col gap-2">
            <div className="flex gap-1">
              {Array.from({ length: step.total }, (_, index) => (
                <div
                  key={index}
                  className={`h-1.5 flex-1 rounded-full ${index < step.current ? 'bg-primary-dark' : 'bg-line'}`}
                />
              ))}
            </div>
            <p className="m-0 text-sm font-medium text-ink-muted">{stepLabel}</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <h1 className="text-[1.75rem] font-bold sm:text-4xl ta:text-2xl ta:sm:text-3xl">{title}</h1>
          {subtitle ? <p className="m-0 text-lg text-ink-muted">{subtitle}</p> : null}
        </div>

        {children}

        {footer ? (
          <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] -mx-4 flex gap-3 border-t border-line bg-surface p-4 sm:-mx-6 sm:px-6 md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 [&>*]:flex-1">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}
