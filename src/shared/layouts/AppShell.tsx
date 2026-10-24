import { ClipboardList, House, Map, PhoneCall, ShieldCheck } from 'lucide-react'
import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

import { emergencyNumbers } from '../../features/emergency/emergencyNumbers'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { env } from '../../config/env'

interface NavItem {
  to: string
  label: string
  // Shorter label for the phone tab bar, so tabs never wrap.
  shortLabel: string
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  end?: boolean
}

function useNavItems(): NavItem[] {
  const { t } = useTranslation()
  const { t: tw } = useTranslation('web')
  return [
    { to: '/', label: t('homeTab'), shortLabel: t('homeTab'), icon: House, end: true },
    { to: '/report', label: t('reportTabNew'), shortLabel: t('reportTab'), icon: ClipboardList },
    { to: '/safety', label: t('safetyTabNew'), shortLabel: tw('safetyTabShort'), icon: Map },
    { to: '/emergency', label: tw('emergencyNav'), shortLabel: tw('emergencyNav'), icon: PhoneCall },
  ]
}

// Active state is a bold label plus an indicator bar, never colour alone.
const desktopLink = ({ isActive }: { isActive: boolean }) =>
  `relative flex min-h-12 items-center rounded-sm px-4 text-base font-semibold hover:bg-tint-soft ${
    isActive
      ? 'text-primary-dark after:absolute after:inset-x-4 after:bottom-1 after:h-[3px] after:rounded-full after:bg-primary-dark'
      : 'text-ink-muted'
  }`

const tabLink = ({ isActive }: { isActive: boolean }) =>
  `relative flex min-h-16 flex-1 flex-col items-center justify-start gap-0.5 px-1 pt-2 text-center text-xs font-semibold leading-tight ${
    isActive
      ? 'text-primary-dark before:absolute before:inset-x-6 before:top-0 before:h-[3px] before:rounded-b-full before:bg-primary-dark'
      : 'text-ink-muted'
  }`

// An SOS pill is in every header outside the emergency page, so help is one tap from anywhere.
function SosPill() {
  const { t } = useTranslation()
  return (
    <Link
      to="/sos"
      aria-label={t('sosHeaderLabel')}
      className="inline-flex min-h-12 items-center gap-1.5 rounded-full bg-sos px-4 text-base sm:px-5 font-extrabold tracking-wider text-white hover:bg-sos-pressed"
    >
      <PhoneCall className="size-4" aria-hidden />
      SOS
    </Link>
  )
}

function SiteFooter() {
  const { t: tw } = useTranslation('web')
  const { t: tc } = useTranslation()
  return (
    <footer className="border-t border-line bg-surface pb-20 md:pb-0">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-ink-muted sm:px-6">
        <p className="m-0 font-semibold text-ink">{tc('appName')}</p>
        <p className="m-0">{tw('footer.disclaimer')}</p>
        {env.dataMode === 'mock' ? <p className="m-0">{tw('footer.demo')}</p> : null}
        <p className="m-0">{tw('footer.emergency', emergencyNumbers)}</p>
      </div>
    </footer>
  )
}

export function AppShell() {
  const { t } = useTranslation()
  const { t: tw } = useTranslation('web')
  const items = useNavItems()
  const { pathname } = useLocation()
  const showSosPill = pathname !== '/emergency'

  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-surface focus:px-4 focus:py-3 focus:font-semibold focus:text-primary-dark"
      >
        {tw('skipToContent')}
      </a>

      <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 rounded-sm text-primary-dark">
            <ShieldCheck className="size-7" aria-hidden />
            <span className="whitespace-nowrap text-base font-bold sm:text-lg">{t('appName')}</span>
          </Link>

          <nav aria-label={tw('mainNav')} className="hidden items-center gap-1 md:flex">
            {items.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} className={desktopLink}>{label}</NavLink>
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

      <nav
        aria-label={tw('mainNav')}
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {items.map(({ to, shortLabel, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={tabLink}>
            <Icon className="size-6" aria-hidden />
            {shortLabel}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
