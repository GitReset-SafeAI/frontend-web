import { Bot, ClipboardList, Eye, EyeOff, Lock, Map, MapPinned, PenLine, PhoneCall, ScanSearch, Users } from 'lucide-react'
import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'

import type { IncidentAnalysis } from '../../services/contracts'
import { ButtonLink } from '../../shared/components/Button'
import { Card } from '../../shared/components/Card'
import { AnalysisSummary } from '../incident-ai'

type Icon = ComponentType<{ className?: string; 'aria-hidden'?: boolean }>

// Static illustration only. It is labelled as a sample and is never a real report or assessment.
const sampleAnalysis: IncidentAnalysis = {
  category: 'following',
  severity: 'moderate',
  confidence: 'medium',
  extractedDetails: [
    { kind: 'vehicle', value: 'bus' },
    { kind: 'place', value: 'station' },
  ],
  missingInformation: ['time', 'location'],
}

const steps: { key: 'report' | 'analyse' | 'check' | 'map'; icon: Icon }[] = [
  { key: 'report', icon: PenLine },
  { key: 'analyse', icon: Bot },
  { key: 'check', icon: ScanSearch },
  { key: 'map', icon: MapPinned },
]

const honest: { key: 'estimate' | 'notSafe' | 'privacy' | 'sos'; icon: Icon }[] = [
  { key: 'estimate', icon: Bot },
  { key: 'notSafe', icon: EyeOff },
  { key: 'privacy', icon: Lock },
  { key: 'sos', icon: PhoneCall },
]

export function LandingPage() {
  const { t } = useTranslation('web')
  const { t: tr } = useTranslation('reporting')

  return (
    <>
      <section className="bg-linear-to-b from-tint-soft to-screen">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:py-20">
          <div className="flex min-w-0 flex-col items-start gap-6">
            <p className="m-0 inline-flex items-center gap-2 rounded-full bg-surface px-4 py-1 text-sm font-semibold text-primary-dark">
              <Eye className="size-4" aria-hidden />
              {t('landing.badge')}
            </p>
            <h1 className="text-4xl font-extrabold sm:text-5xl lg:text-[3.25rem] ta:text-[1.75rem] ta:sm:text-4xl ta:lg:text-[2.5rem] si:text-3xl si:sm:text-4xl si:lg:text-[2.75rem]">{t('landing.title')}</h1>
            <p className="m-0 max-w-xl text-lg text-ink-muted">{t('landing.subtitle')}</p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <ButtonLink to="/report" icon={<ClipboardList className="size-5" aria-hidden />}>
                {t('landing.ctaReport')}
              </ButtonLink>
              <ButtonLink to="/safety" variant="secondary" icon={<Map className="size-5" aria-hidden />}>
                {t('landing.ctaMap')}
              </ButtonLink>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-3" aria-label={t('landing.previewTitle')} role="group">
            <p className="m-0 text-sm font-semibold text-ink-muted">
              {t('landing.previewTitle')} · {t('landing.previewNote')}
            </p>
            <Card className="flex flex-col gap-1">
              <p className="m-0 text-sm font-semibold text-ink-muted">{tr('submitted.yourWords')}</p>
              <p className="m-0">{t('landing.previewWords')}</p>
            </Card>
            <AnalysisSummary analysis={sampleAnalysis} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold sm:text-3xl">{t('landing.problemTitle')}</h2>
          <p className="mt-3 text-lg text-ink-muted">{t('landing.problemBody')}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <h2 className="text-2xl font-bold sm:text-3xl">{t('landing.stepsTitle')}</h2>
        <ol className="m-0 mt-6 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ key, icon: Icon }, index) => (
            <li key={key}>
              <Card className="flex h-full flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-12 place-items-center rounded-full bg-tint text-primary-dark">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <span className="text-sm font-bold text-ink-muted">{index + 1}</span>
                </div>
                <h3 className="text-lg font-semibold">{t(`landing.steps.${key}.title`)}</h3>
                <p className="m-0 text-ink-muted">{t(`landing.steps.${key}.body`)}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">{t('landing.honestTitle')}</h2>
          <ul className="m-0 mt-6 grid list-none gap-6 p-0 sm:grid-cols-2">
            {honest.map(({ key, icon: Icon }) => (
              <li key={key} className="flex gap-4">
                <Icon className="mt-1 size-6 shrink-0 text-primary-dark" aria-hidden />
                <div>
                  <h3 className="text-lg font-semibold">{t(`landing.honest.${key}.title`)}</h3>
                  <p className="m-0 mt-1 text-ink-muted">{t(`landing.honest.${key}.body`)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="flex items-center gap-3 text-2xl font-bold sm:text-3xl">
          <Users className="size-7" aria-hidden />
          {t('landing.audienceTitle')}
        </h2>
        <ul className="mt-4 grid gap-3 p-0 sm:grid-cols-3">
          {(['travellers', 'planners', 'contributors'] as const).map((key) => (
            <li key={key} className="list-none">
              <Card className="h-full">{t(`landing.audience.${key}`)}</Card>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="flex flex-col items-start gap-4 rounded-lg bg-tint-soft p-6 sm:p-10">
          <h2 className="text-2xl font-bold sm:text-3xl">{t('landing.finalTitle')}</h2>
          <p className="m-0 text-lg text-ink-muted">{t('landing.finalBody')}</p>
          <ButtonLink to="/report" icon={<ClipboardList className="size-5" aria-hidden />}>
            {t('landing.ctaReport')}
          </ButtonLink>
        </div>
      </section>
    </>
  )
}
