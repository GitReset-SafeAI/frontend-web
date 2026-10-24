import { ClipboardList, House, LifeBuoy, Map, PhoneCall, UserRound } from 'lucide-react'
import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

import { env } from '../../config/env'
import { useAuth } from '../../features/account/authContext'
import { BrandLogo } from '../components/Brand'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

type IconType = ComponentType<{ className?: string; 'aria-hidden'?: boolean }>

interface NavItem {
  to: string
  label: string
  // Shorter label for the phone tab bar and the desktop pill, so nothing wraps in any language.
  shortLabel: string
  icon: IconType
  end?: boolean
}

function useNavItems() {
  const { t } = useTranslation()
  const { t: tw } = useTranslation('web')
  const { t: ta } = useTranslation('account')
  const { user } = useAuth()
  const home: NavItem = { to: '/', label: t('homeTab'), shortLabel: t('homeTab'), icon: House, end: true }
  const report: NavItem = { to: '/report', label: t('reportTabNew'), shortLabel: t('reportTab'), icon: ClipboardList }
  const safety: NavItem = { to: '/safety', label: t('safetyTabNew'), shortLabel: tw('safetyTabShort'), icon: Map }
  const emergency: NavItem = { to: '/emergency', label: tw('emergencyNav'), shortLabel: tw('emergencyNav'), icon: LifeBuoy }
  // One slot that is "Log in" until you are, then "Account".
  const account: NavItem = user
    ? { to: '/account', label: ta('nav.account'), shortLabel: ta('nav.account'), icon: UserRound }
    : { to: '/login', label: ta('nav.login'), shortLabel: ta('nav.login'), icon: UserRound }
  return { home, report, safety, emergency, account }
}

// Desktop: a segmented pill. The active item is lifted onto a white chip and bold, never colour alone.
const pillLink = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-11 items-center whitespace-nowrap rounded-full px-5 text-[0.9375rem] font-semibold transition-colors ${
    isActive ? 'bg-surface text-navy shadow-card' : 'text-ink-muted hover:text-navy'
  }`

const tabLink = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-center text-[0.6875rem] font-semibold leading-tight transition-colors ${
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

// Desktop header: "Log in" until you are, then your initial. On phones this lives in the tab bar instead.
function AccountButton() {
  const { t } = useTranslation('account')
  const { user } = useAuth()
  const { pathname } = useLocation()

  if (user) {
    return (
      <Link
        to="/account"
        aria-label={t('nav.accountA11y', { name: user.name })}
        className="hidden size-12 place-items-center rounded-full bg-navy text-lg font-bold uppercase text-white shadow-card hover:bg-navy-hover lg:grid"
      >
        {user.name.trim().charAt(0) || <UserRound className="size-5" aria-hidden />}
      </Link>
    )
  }
  return (
    <Link
      to="/login"
      state={{ from: pathname }}
      aria-label={t('nav.login')}
      className="hidden min-h-12 items-center gap-2 rounded-full border-2 border-navy px-3 font-semibold text-navy hover:bg-mint-soft lg:inline-flex xl:px-5"
    >
      <UserRound className="size-5" aria-hidden />
      <span className="hidden xl:inline">{t('nav.login')}</span>
    </Link>
  )
}

function SiteFooter() {
  const { t: tw } = useTranslation('web')
  const { home, report, safety, emergency, account } = useNavItems()
  return (
    <footer className="bg-navy pb-28 text-screen lg:pb-0">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-3 text-sm text-on-navy-muted">
          <BrandLogo onDark />
          <p className="m-0 max-w-xl">{tw('footer.disclaimer')}</p>
          {env.dataMode === 'mock' ? <p className="m-0">{tw('footer.demo')}</p> : null}
        </div>
        <nav aria-label={tw('footerNav')} className="flex flex-wrap content-start gap-x-6 gap-y-1 font-semibold md:justify-end">
          {[home, report, safety, emergency, account].map((item) => (
            <Link key={item.to} to={item.to} className="inline-flex min-h-11 items-center rounded-sm text-screen underline-offset-4 hover:underline [&:focus-visible]:outline-mint">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}

function Tab({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <NavLink to={item.to} end={item.end} className={tabLink}>
      {({ isActive }) => (
        <>
          <span className={`grid h-8 w-12 place-items-center rounded-full transition-colors ${isActive ? 'bg-mint-light' : ''}`}>
            <Icon className="size-6" aria-hidden />
          </span>
          {item.shortLabel}
        </>
      )}
    </NavLink>
  )
}

export function AppShell() {
  const { t: tw } = useTranslation('web')
  const { home, report, safety, emergency, account } = useNavItems()
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

          <nav aria-label={tw('mainNav')} className="hidden items-center gap-1 rounded-full bg-mint-soft p-1 lg:flex">
            {[home, report, safety, emergency].map(({ to, shortLabel, end }) => (
              <NavLink key={to} to={to} end={end} className={pillLink}>{shortLabel}</NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {showSosPill ? <SosPill /> : null}
            <LanguageSwitcher />
            <AccountButton />
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1">
        <Outlet />
      </main>

      <SiteFooter />

      {/* Phones and tablets: a floating bar with the one action that matters, reporting, raised in the middle. */}
      <nav
        aria-label={tw('mainNav')}
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
      >
        <div className="pointer-events-auto relative mx-auto grid max-w-xl grid-cols-[1fr_1fr_5rem_1fr_1fr] items-end rounded-lg border border-line/70 bg-surface shadow-lift">
          <Tab item={home} />
          <Tab item={safety} />
          <NavLink
            to={report.to}
            aria-label={report.label}
            className="group flex flex-col items-center justify-end gap-0.5 pb-2 text-[0.6875rem] font-semibold text-navy"
          >
            <span className="-mt-8 grid size-16 place-items-center rounded-full bg-coral text-navy shadow-[0_8px_20px_rgb(233_115_107/0.45)] ring-4 ring-screen transition-transform group-active:scale-95">
              <ReportIcon className="size-7" aria-hidden />
            </span>
            {report.shortLabel}
          </NavLink>
          <Tab item={emergency} />
          <Tab item={account} />
        </div>
      </nav>
    </div>
  )
}
