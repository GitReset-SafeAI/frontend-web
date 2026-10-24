import { Contact, FlaskConical, Lock, PhoneCall } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { DEMO_EMAIL } from '../../../config/demo'
import { env } from '../../../config/env'
import { ApiError } from '../../../services/api/ApiError'
import { logInInputSchema, signUpInputSchema } from '../../../services/contracts/account'
import { AsidePanel } from '../../../shared/components/AsidePanel'
import { Button } from '../../../shared/components/Button'
import { Field } from '../../../shared/components/Field'
import { InfoNote } from '../../../shared/components/InfoNote'
import { MAX_CONTACTS } from '../../../services/contracts/account'
import { useAuth } from '../authContext'

type Mode = 'login' | 'signup'
type FieldErrors = Partial<Record<'name' | 'email' | 'password', string>>

const tabClass = (active: boolean) =>
  `inline-flex min-h-12 flex-1 items-center justify-center rounded-full px-4 font-semibold transition-colors ${
    active ? 'bg-surface text-navy shadow-card' : 'text-ink-muted hover:text-navy'
  }`

// Sign-in is a demo until the backend exists (see the note on the page): the service boundary is real, the
// security is not. It is labelled as such so nobody mistakes it for the real thing.
export function LoginPage() {
  const { t } = useTranslation('account')
  const { user, status, logIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const mode: Mode = params.get('mode') === 'signup' ? 'signup' : 'login'
  const from = typeof (location.state as { from?: unknown } | null)?.from === 'string' ? (location.state as { from: string }).from : undefined

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | undefined>()
  const [pending, setPending] = useState(false)

  // Already signed in: nothing to do here.
  if (status === 'ready' && user && !pending) return <Navigate to={from ?? '/account'} replace />

  const switchMode = (next: Mode) => {
    setErrors({})
    setFormError(undefined)
    setParams(next === 'signup' ? { mode: 'signup' } : {}, { replace: true, state: location.state })
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(undefined)

    const parsed = mode === 'signup'
      ? signUpInputSchema.safeParse({ name, email, password })
      : logInInputSchema.safeParse({ email, password })
    if (!parsed.success) {
      const next: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if (field === 'name' || field === 'email' || field === 'password') {
          next[field] ??= t(field === 'password' && mode === 'login' ? 'auth.errors.passwordRequired' : `auth.errors.${field}`)
        }
      }
      setErrors(next)
      return
    }
    setErrors({})

    setPending(true)
    try {
      if (mode === 'signup') await signUp(signUpInputSchema.parse({ name, email, password }))
      else await logIn(logInInputSchema.parse({ email, password }))
      // A new account has no contacts, so it always goes to the place where they are added: that is what the
      // account is for. Logging in returns you to where you were.
      void navigate(mode === 'signup' ? '/account' : (from ?? '/'), { replace: true })
    } catch (error) {
      const kind = error instanceof ApiError ? error.kind : 'unknown'
      setFormError(t(kind === 'not-found' ? 'auth.errors.notFound' : kind === 'conflict' ? 'auth.errors.conflict' : 'auth.errors.generic'))
      setPending(false)
    }
  }

  // One click into the ready-made demo account (mock mode only). It goes back to where you were, or to the
  // account page, where the sample contacts are.
  const signInToDemo = async () => {
    setErrors({})
    setFormError(undefined)
    setPending(true)
    try {
      await logIn({ email: DEMO_EMAIL, password: 'demo' })
      void navigate(from ?? '/account', { replace: true })
    } catch {
      setFormError(t('auth.errors.generic'))
      setPending(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="rounded-lg lg:border lg:border-line/70 lg:bg-surface lg:p-10 lg:shadow-card">
          <div className="mx-auto flex max-w-lg flex-col gap-6 lg:mx-0">
            <div role="tablist" aria-label={t('auth.tabsA11y')} className="flex gap-1 rounded-full bg-mint-soft p-1">
              <button type="button" role="tab" aria-selected={mode === 'login'} className={tabClass(mode === 'login')} onClick={() => { switchMode('login') }}>
                {t('auth.loginTab')}
              </button>
              <button type="button" role="tab" aria-selected={mode === 'signup'} className={tabClass(mode === 'signup')} onClick={() => { switchMode('signup') }}>
                {t('auth.signupTab')}
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <h1 className="display-lg">{mode === 'signup' ? t('auth.signupTitle') : t('auth.loginTitle')}</h1>
              <p className="m-0 text-lg text-ink-muted">{mode === 'signup' ? t('auth.signupSubtitle') : t('auth.loginSubtitle')}</p>
            </div>

            <form onSubmit={(event) => { void submit(event) }} noValidate className="flex flex-col gap-5">
              {mode === 'signup' ? (
                <Field label={t('auth.name')} value={name} onChange={(e) => { setName(e.target.value) }} error={errors.name} autoComplete="name" maxLength={60} />
              ) : null}
              <Field
                label={t('auth.email')}
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value) }}
                error={errors.email}
                autoComplete="email"
              />
              <Field
                label={t('auth.password')}
                type="password"
                hint={mode === 'signup' ? t('auth.passwordHint') : undefined}
                value={password}
                onChange={(e) => { setPassword(e.target.value) }}
                error={errors.password}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
              {formError ? <InfoNote tone="error" text={formError} /> : null}
              <Button type="submit" loading={pending}>{mode === 'signup' ? t('auth.signupSubmit') : t('auth.loginSubmit')}</Button>
            </form>

            {env.dataMode === 'mock' ? (
              <div className="flex flex-col gap-3 rounded-lg border-2 border-dashed border-ink-muted/50 p-5">
                <h2 className="flex items-center gap-2 font-sans text-lg font-bold tracking-normal">
                  <FlaskConical className="size-5" aria-hidden />
                  {t('auth.demoAccount.title')}
                </h2>
                <p className="m-0 text-ink-muted">{t('auth.demoAccount.body')}</p>
                <p className="m-0 text-sm font-semibold tabular-nums">{DEMO_EMAIL}</p>
                <Button variant="tonal" loading={pending} onClick={() => { void signInToDemo() }}>{t('auth.demoAccount.button')}</Button>
              </div>
            ) : null}

            <InfoNote text={t('auth.demoNote')} />
          </div>
        </div>

        <aside className="hidden lg:sticky lg:top-24 lg:block">
          <AsidePanel
            title={t('auth.aside.title')}
            items={[
              { icon: Contact, text: t('auth.aside.contacts', { max: MAX_CONTACTS }) },
              { icon: PhoneCall, text: t('auth.aside.sos') },
              { icon: Lock, text: t('auth.aside.private') },
            ]}
          />
        </aside>
      </div>
    </div>
  )
}
