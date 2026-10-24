import { Bot, Check, ClipboardList, EyeOff, Lock, Map, MapPin, PenLine, PhoneCall, ScanSearch } from 'lucide-react'
import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'

import type { IncidentAnalysis } from '../../services/contracts'
import { ButtonLink } from '../../shared/components/Button'
import { RoadArt } from '../../shared/components/RoadArt'
import { EstimateTicket } from '../incident-ai'

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

const stations: { key: 'report' | 'analyse' | 'check' | 'map'; icon: Icon }[] = [
  { key: 'report', icon: PenLine },
  { key: 'analyse', icon: Bot },
  { key: 'check', icon: ScanSearch },
  { key: 'map', icon: MapPin },
]

// Each principle is a "road sign": a different shape and colour so they are told apart at a glance.
const signs: { key: 'estimate' | 'notSafe' | 'privacy' | 'sos'; icon: Icon; shape: string; tone: string; iconClass?: string }[] = [
  { key: 'estimate', icon: Bot, shape: 'rounded-full', tone: 'bg-mint text-navy' },
  { key: 'notSafe', icon: EyeOff, shape: 'rotate-45 rounded-lg', tone: 'bg-coral text-navy', iconClass: '-rotate-45' },
  { key: 'privacy', icon: Lock, shape: 'rounded-lg', tone: 'bg-screen text-navy' },
  { key: 'sos', icon: PhoneCall, shape: 'rounded-full', tone: 'bg-sos text-white' },
]

export function LandingPage() {
  const { t } = useTranslation('web')

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-b from-mint-soft via-screen to-screen">
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-14 px-4 pb-52 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:pb-72 lg:pt-24">
          <div className="rise flex min-w-0 flex-col items-start gap-6">
            <h1 className="display-xl">
              {t('landing.titleLead')} <em className="scribble">{t('landing.titleEmphasis')}</em>
            </h1>
            <p className="m-0 max-w-lg text-lg text-ink-muted sm:text-xl">{t('landing.subtitle')}</p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <ButtonLink to="/report" variant="accent" icon={<ClipboardList className="size-5" aria-hidden />}>
                {t('landing.ctaReport')}
              </ButtonLink>
              <ButtonLink to="/safety" variant="secondary" icon={<Map className="size-5" aria-hidden />}>
                {t('landing.ctaMap')}
              </ButtonLink>
            </div>
          </div>

          <div className="rise mx-auto flex w-full max-w-md min-w-0 flex-col gap-3 [animation-delay:150ms]" role="group" aria-label={t('landing.previewTitle')}>
            <div className="lg:rotate-[1.5deg]">
              <EstimateTicket compact words={t('landing.previewWords')} analysis={sampleAnalysis} />
            </div>
            <p className="m-0 text-center text-sm font-semibold text-ink-muted">{t('landing.previewNote')}</p>
          </div>
        </div>
        <RoadArt animated className="pointer-events-none absolute inset-x-0 bottom-0 h-[clamp(10rem,21.7vw,20rem)] w-full" />
      </section>

      {/* The problem */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="max-w-3xl">
          <h2 className="text-3xl sm:text-4xl">{t('landing.problemTitle')}</h2>
          <p className="mt-4 text-lg text-ink-muted sm:text-xl">{t('landing.problemBody')}</p>
        </div>
      </section>

      {/* How it works: a route with four stops, ending at the pin */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <h2 className="text-3xl sm:text-4xl">{t('landing.stepsTitle')}</h2>
        <ol className="relative m-0 mt-12 grid list-none gap-10 p-0 lg:grid-cols-4 lg:gap-6">
          <span className="absolute bottom-6 left-6 top-6 w-1.5 -translate-x-1/2 rounded-full bg-navy lg:inset-x-0 lg:bottom-auto lg:left-0 lg:top-6 lg:h-1.5 lg:w-auto lg:translate-x-0" aria-hidden />
          {stations.map(({ key, icon: StopIcon }, index) => {
            const destination = index === stations.length - 1
            return (
              <li key={key} className="relative pl-20 lg:pl-0 lg:pt-20">
                <span
                  className={`absolute left-0 top-0 grid size-12 place-items-center rounded-full border-4 border-navy font-display text-xl font-bold text-navy shadow-card ${destination ? 'bg-coral' : 'bg-mint'}`}
                >
                  {destination ? <MapPin className="size-6" aria-hidden /> : index + 1}
                </span>
                <h3 className="flex items-center gap-2 text-xl font-bold">
                  <StopIcon className="size-5 text-ink-muted" aria-hidden />
                  {t(`landing.steps.${key}.title`)}
                </h3>
                <p className="m-0 mt-2 text-ink-muted">{t(`landing.steps.${key}.body`)}</p>
              </li>
            )
          })}
        </ol>
      </section>

      {/* Principles as road signs */}
      <section className="bg-navy text-screen">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-3xl text-screen sm:text-4xl">{t('landing.honestTitle')}</h2>
          <ul className="m-0 mt-12 grid list-none gap-x-6 gap-y-10 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {signs.map(({ key, icon: SignIcon, shape, tone, iconClass }) => (
              <li key={key} className="flex flex-col gap-4">
                <span className="grid size-16 place-items-center">
                  <span className={`grid size-14 place-items-center shadow-[0_6px_16px_rgb(0_0_0/0.25)] ${shape} ${tone}`}>
                    <SignIcon className={`size-7 ${iconClass ?? ''}`} aria-hidden />
                  </span>
                </span>
                <div>
                  <h3 className="text-lg font-bold text-screen">{t(`landing.honest.${key}.title`)}</h3>
                  <p className="m-0 mt-1.5 text-on-navy-muted">{t(`landing.honest.${key}.body`)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Who it is for, and the call to action */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="relative overflow-hidden rounded-lg bg-mint-light px-6 pb-48 pt-12 sm:px-12 sm:pb-52 sm:pt-16">
          <div className="relative z-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="flex flex-col items-start gap-5">
              <h2 className="display-lg">{t('landing.finalTitle')}</h2>
              <p className="m-0 max-w-xl text-lg text-ink">{t('landing.finalBody')}</p>
              <ButtonLink to="/report" variant="accent" icon={<ClipboardList className="size-5" aria-hidden />}>
                {t('landing.ctaReport')}
              </ButtonLink>
            </div>
            <div>
              <p className="m-0 mb-3 text-sm font-bold uppercase tracking-wider text-ink-muted">{t('landing.audienceTitle')}</p>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {(['travellers', 'planners', 'contributors'] as const).map((key) => (
                  <li key={key} className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-navy text-white">
                      <Check className="size-3.5" aria-hidden />
                    </span>
                    {t(`landing.audience.${key}`)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <RoadArt className="pointer-events-none absolute inset-x-0 bottom-0 h-[clamp(9rem,19vw,16rem)] w-full" />
        </div>
      </section>
    </>
  )
}
