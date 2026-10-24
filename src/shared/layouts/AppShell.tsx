import { ClipboardList, House, Map, PhoneCall } from 'lucide-react'
import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

import { env } from '../../config/env'
import { emergencyNumbers } from '../../features/emergency/emergencyNumbers'
import { BrandLogo } from '../components/Brand'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

type IconType = ComponentType<{ className?: string; 'aria-hidden'?: boolean }>

interface NavItem {
  to: string
  label: string
  // Shorter label for the phone tab bar, so tabs never wrap.
  shortLabel: string
  icon: IconType
  end?: boolean
}

function useNavItems() {
  const { t } = useTranslation()
  const { t: tw } = useTranslation('web')
  const home: NavItem = { to: '/', label: t('homeTab'), shortLabel: t('homeTab'), icon: House, end: true }
  const report: NavItem = { to: '/report', label: t('reportTabNew'), shortLabel: t('reportTab'), icon: ClipboardList }
  const safety: NavItem = { to: '/safety', label: t('safetyTabNew'), shortLabel: tw('safetyTabShort'), icon: Map }
  const emergency: NavItem = { to: '/emergency', label: tw('emergencyNav'), shortLabel: tw('emergencyNav'), icon: PhoneCall }
  return { home, report, safety, emergency }
}

// Desktop: a segmented pill. The active item is lifted onto a white chip and bold, never colour alone.
const pillLink = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-11 items-center rounded-full px-5 text-[0.9375rem] font-semibold transition-colors ${
    isActive ? 'bg-surface text-navy shadow-card' : 'text-ink-muted hover:text-navy'
  }`

const tabLink = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-lg px-2 text-center text-xs font-semibold leading-tight transition-colors ${
    isActive ? 'text-navy' : 'text-ink-muted'
  }`

// An SOS pill is in every header outside the emergency page, so help is one tap from anywhere.
function SosPill() {
  const { t } = useTranslation()
  return (
    <Link
      to="/sos"
      aria-label={t('sosHeaderLabel')}
      className="inline-flex min-h-12 items-center gap-1.5 rounded-full bg-sos px-4 text-base font-extrabold tracking-wider text-white shadow-[0_4px_14px_rgb(166_37_50/0.35)] hover:bg-sos-pressed sm:px-5"
    >
      <PhoneCall className="size-4" aria-hidden />
      SOS
    </Link>
  )
}

function SiteFooter() {
  const { t: tw } = useTranslation('web')
  const { home, report, safety, emergency } = useNavItems()
  return (
    <footer className="bg-navy pb-28 text-screen md:pb-0">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-3 text-sm text-on-navy-muted">
          <BrandLogo onDark />
          <p className="m-0 max-w-xl">{tw('footer.disclaimer')}</p>
          {env.dataMode === 'mock' ? <p className="m-0">{tw('footer.demo')}</p> : null}
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <nav aria-label={tw('footerNav')} className="flex flex-wrap gap-x-6 gap-y-1 font-semibold">
            {[home, report, safety, emergency].map((item) => (
              <Link key={item.to} to={item.to} className="inline-flex min-h-11 items-center rounded-sm text-screen underline-offset-4 hover:underline [&:focus-visible]:outline-mint">
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="m-0 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-screen">
            {tw('footer.emergency', emergencyNumbers)}
          </p>
        </div>
      </div>
    </footer>
  )
}

export function AppShell() {
  const { t: tw } = useTranslation('web')
  const { home, report, safety, emergency } = useNavItems()
  const { pathname } = useLocation()
  const showSosPill = pathname !== '/emergency'
  const ReportIcon = report.icon

  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-surface focus:px-5 focus:py-3 focus:font-semibold focus:text-navy"
      >
        {tw('skipToContent')}
      </a>

      <header className="sticky top-0 z-20 border-b border-line/70 bg-screen/85 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" className="rounded-sm">
            <BrandLogo />
          </Link>

          <nav aria-label={tw('mainNav')} className="hidden items-center gap-1 rounded-full bg-mint-soft p-1 md:flex">
            {[home, report, safety, emergency].map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} className={pillLink}>{label}</NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {showSosPill ? <SosPill /> : null}
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1">
        <Outlet />
      </main>

      <SiteFooter />

      {/* Phones: a floating bar with the one action that matters, reporting, raised in the middle. */}
      <nav
        aria-label={tw('mainNav')}
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
      >
        <div className="pointer-events-auto relative grid grid-cols-[1fr_5.5rem_1fr] items-end rounded-lg border border-line/70 bg-surface shadow-lift">
          <NavLink to={home.to} end className={tabLink}>
            {({ isActive }) => (
              <>
                <span className={`grid h-8 w-14 place-items-center rounded-full transition-colors ${isActive ? 'bg-mint-light' : ''}`}>
                  <home.icon className="size-6" aria-hidden />
                </span>
                {home.shortLabel}
              </>
            )}
          </NavLink>

          <NavLink
            to={report.to}
            aria-label={report.label}
            className="group flex flex-col items-center justify-end gap-0.5 pb-2 text-xs font-semibold text-navy"
          >
            <span className="-mt-8 grid size-16 place-items-center rounded-full bg-coral text-navy shadow-[0_8px_20px_rgb(233_115_107/0.45)] ring-4 ring-screen transition-transform group-active:scale-95">
              <ReportIcon className="size-7" aria-hidden />
            </span>
            {report.shortLabel}
          </NavLink>

          <NavLink to={safety.to} className={tabLink}>
            {({ isActive }) => (
              <>
                <span className={`grid h-8 w-14 place-items-center rounded-full transition-colors ${isActive ? 'bg-mint-light' : ''}`}>
                  <safety.icon className="size-6" aria-hidden />
                </span>
                {safety.shortLabel}
              </>
            )}
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
