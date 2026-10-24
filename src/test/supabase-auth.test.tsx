import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mock = vi.hoisted(() => ({
  getSession: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  unsubscribe: vi.fn(),
  listeners: new Set<(event: AuthChangeEvent, session: Session | null) => void>(),
  env: {
    authMode: 'supabase', dataMode: 'mock',
    supabaseUrl: 'https://example.supabase.co',
    supabasePublishableKey: 'sb_publishable_test_placeholder',
  },
}))

vi.mock('../config/env', () => ({ env: mock.env }))
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ auth: {
    getSession: mock.getSession,
    signInWithPassword: mock.signInWithPassword,
    signOut: mock.signOut,
    onAuthStateChange: (listener: (event: AuthChangeEvent, session: Session | null) => void) => {
      mock.listeners.add(listener)
      return { data: { subscription: { unsubscribe: () => {
        mock.unsubscribe()
        mock.listeners.delete(listener)
      } } } }
    },
  } })),
}))

import { createClient } from '@supabase/supabase-js'
import { services, selectServices } from '../services'
import { apiServices } from '../services/api'
import { mockServices } from '../services/mocks'
import { supabaseAuth } from '../services/auth/supabaseAuth'
import { getSupabaseClient } from '../services/auth/supabaseClient'
import { renderApp } from './renderApp'

const realUser: User = {
  id: 'real-user', email: 'person@example.com', user_metadata: { name: 'Nimali' },
  app_metadata: {}, aud: 'authenticated', created_at: '2026-01-01T00:00:00Z',
}
const session: Session = {
  user: realUser, access_token: 'mock-access-token', refresh_token: 'mock-refresh-token',
  expires_in: 3600, token_type: 'bearer',
}
const restored = { data: { session }, error: null }
const loggedOut = { data: { session: null }, error: null }

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => { resolve = done })
  return { promise, resolve }
}

async function emit(event: AuthChangeEvent, value: Session | null) {
  await act(async () => { for (const listener of mock.listeners) listener(event, value) })
}

async function fillLogin() {
  const user = userEvent.setup()
  await waitFor(() => { expect(screen.getByLabelText('Email')).toBeEnabled() })
  await user.type(screen.getByLabelText('Email'), 'person@example.com')
  await user.type(screen.getByLabelText('Password'), 'test-password')
  return user
}

beforeEach(() => {
  vi.clearAllMocks()
  mock.listeners.clear()
  mock.env.supabaseUrl = 'https://example.supabase.co'
  mock.env.supabasePublishableKey = 'sb_publishable_test_placeholder'
  mock.getSession.mockResolvedValue(loggedOut)
  mock.signInWithPassword.mockResolvedValue(restored)
  mock.signOut.mockResolvedValue({ error: null })
})

describe('Supabase password login', () => {
  it('logs in through the existing form and preserves its home redirect', async () => {
    renderApp('/login')
    const user = await fillLogin()
    await user.click(screen.getByRole('button', { name: /^log in$/i }))
    expect(await screen.findByRole('heading', { name: /know what has been reported/i })).toBeInTheDocument()
    expect(mock.signInWithPassword).toHaveBeenCalledExactlyOnceWith({ email: 'person@example.com', password: 'test-password' })
    expect(createClient).toHaveBeenCalledWith(mock.env.supabaseUrl, mock.env.supabasePublishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
    expect(screen.getByRole('link', { name: /your account, nimali/i })).toBeInTheDocument()
  })

  it.each([
    [{ code: 'invalid_credentials' }, /email or password is incorrect/i],
    [{ code: 'email_not_confirmed' }, /confirm your email/i],
    [{ status: 429 }, /too many login attempts/i],
    [{ name: 'AuthRetryableFetchError' }, /unable to reach authentication/i],
    [{ code: 'provider_failure', message: 'private provider detail' }, /something went wrong/i],
  ])('maps provider failure %j without exposing provider messages', async (error, message) => {
    mock.signInWithPassword.mockResolvedValue({ data: { session: null }, error })
    renderApp('/login')
    const user = await fillLogin()
    await user.click(screen.getByRole('button', { name: /^log in$/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.queryByText(/private provider detail/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^log in$/i })).toBeEnabled()
  })

  it('handles rejected network requests', async () => {
    mock.signInWithPassword.mockRejectedValue(new TypeError('private network detail'))
    renderApp('/login')
    const user = await fillLogin()
    await user.click(screen.getByRole('button', { name: /^log in$/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/unable to reach authentication/i)
  })

  it('keeps signup and demo controls out of real mode, including a signup URL', async () => {
    renderApp('/login?mode=signup')
    await fillLogin()
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Your name')).not.toBeInTheDocument()
    expect(screen.queryByText(/demo sign-in/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /use demo account/i })).not.toBeInTheDocument()
    await expect(supabaseAuth.signUp({ name: 'Test', email: 'person@example.com', password: 'password1' })).rejects.toMatchObject({ kind: 'not-implemented' })
  })

  it('disables the form during login and prevents repeated requests', async () => {
    const pending = deferred<typeof restored>()
    mock.signInWithPassword.mockReturnValue(pending.promise)
    renderApp('/login')
    const user = await fillLogin()
    await user.dblClick(screen.getByRole('button', { name: /^log in$/i }))
    expect(mock.signInWithPassword).toHaveBeenCalledTimes(1)
    expect(screen.getByLabelText('Email')).toBeDisabled()
    expect(screen.getByLabelText('Password')).toBeDisabled()
    expect(screen.getByRole('button', { name: /^log in$/i })).toHaveAttribute('aria-busy', 'true')
    await act(async () => { pending.resolve(restored) })
    expect(await screen.findByRole('heading', { name: /know what has been reported/i })).toBeInTheDocument()
  })
})

describe('session lifecycle and redirects', () => {
  it('accepts a safe return destination after login', async () => {
    renderApp('/login', { state: { from: '/safety' } })
    const user = await fillLogin()
    await user.click(screen.getByRole('button', { name: /^log in$/i }))
    expect(await screen.findByTestId('map-slot')).toBeInTheDocument()
  })

  it('rejects an external return destination after login', async () => {
    renderApp('/login', { state: { from: '//outside.example' } })
    const user = await fillLogin()
    await user.click(screen.getByRole('button', { name: /^log in$/i }))
    expect(await screen.findByRole('heading', { name: /know what has been reported/i })).toBeInTheDocument()
  })

  it('cleans up StrictMode subscriptions and ignores its abandoned session lookup', async () => {
    const abandoned = deferred<typeof restored>()
    mock.getSession.mockReturnValueOnce(abandoned.promise).mockResolvedValueOnce(loggedOut)
    const view = renderApp('/login', { strict: true })
    await waitFor(() => { expect(screen.getByRole('button', { name: /^log in$/i })).toBeEnabled() })
    expect(mock.getSession).toHaveBeenCalledTimes(2)
    expect(mock.listeners.size).toBe(1)
    await act(async () => { abandoned.resolve(restored) })
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    view.unmount()
    expect(mock.listeners.size).toBe(0)
    expect(mock.unsubscribe).toHaveBeenCalledTimes(2)
  })

  it('clears private contact cache when the auth identity changes or signs out', async () => {
    mock.getSession.mockResolvedValue(restored)
    const { queryClient } = renderApp('/account')
    await screen.findByRole('heading', { name: /hello, nimali/i })
    queryClient.setQueryData(['contacts', realUser.id], [{ name: 'Private contact' }])
    await emit('TOKEN_REFRESHED', session)
    expect(queryClient.getQueryData(['contacts', realUser.id])).toBeDefined()
    await emit('SIGNED_IN', { ...session, user: { ...realUser, id: 'another-user' } })
    expect(queryClient.getQueryData(['contacts', realUser.id])).toBeUndefined()
    queryClient.setQueryData(['contacts', 'another-user'], [{ name: 'Another private contact' }])
    await emit('SIGNED_OUT', null)
    expect(queryClient.getQueryData(['contacts', 'another-user'])).toBeUndefined()
  })

  it('waits for restoration before redirecting a protected page, then restores the user', async () => {
    const pending = deferred<typeof restored>()
    mock.getSession.mockReturnValue(pending.promise)
    renderApp('/account')
    expect(screen.getByRole('status')).toHaveTextContent(/loading your account/i)
    expect(screen.queryByRole('heading', { name: /welcome back/i })).not.toBeInTheDocument()
    await act(async () => { pending.resolve(restored) })
    expect(await screen.findByRole('heading', { name: /hello, nimali/i })).toBeInTheDocument()
    expect(screen.getByText(/contact storage and SOS contact calling are not connected/i)).toBeInTheDocument()
  })

  it('redirects a restored user away from login', async () => {
    mock.getSession.mockResolvedValue(restored)
    renderApp('/login')
    expect(await screen.findByRole('heading', { name: /hello, nimali/i })).toBeInTheDocument()
  })

  it('disables login until the initial session check completes', async () => {
    const pending = deferred<typeof loggedOut>()
    mock.getSession.mockReturnValue(pending.promise)
    renderApp('/login')
    expect(screen.getByRole('button', { name: /^log in$/i })).toBeDisabled()
    expect(screen.getByLabelText('Email')).toBeDisabled()
    await act(async () => { pending.resolve(loggedOut) })
    expect(screen.getByRole('button', { name: /^log in$/i })).toBeEnabled()
  })

  it('returns to the protected page after login', async () => {
    renderApp('/account')
    await screen.findByRole('heading', { name: /welcome back/i })
    const user = await fillLogin()
    await user.click(screen.getByRole('button', { name: /^log in$/i }))
    expect(await screen.findByRole('heading', { name: /hello, nimali/i })).toBeInTheDocument()
  })

  it('shows restoration failures instead of silently falling back to demo', async () => {
    mock.getSession.mockRejectedValue(new Error('private restoration detail'))
    renderApp('/login')
    expect(await screen.findByRole('alert')).toHaveTextContent(/something went wrong/i)
    expect(screen.getByRole('button', { name: /^log in$/i })).toBeEnabled()
    expect(screen.queryByText(/private restoration detail/)).not.toBeInTheDocument()
  })

  it('responds to sign-in, refresh, user updates, and external sign-out', async () => {
    renderApp('/account')
    await screen.findByRole('heading', { name: /welcome back/i })
    await emit('SIGNED_IN', session)
    expect(await screen.findByRole('heading', { name: /hello, nimali/i })).toBeInTheDocument()
    await emit('TOKEN_REFRESHED', session)
    await emit('USER_UPDATED', { ...session, user: { ...realUser, user_metadata: { name: 'Updated' } } })
    expect(await screen.findByRole('heading', { name: /hello, updated/i })).toBeInTheDocument()
    await emit('SIGNED_OUT', null)
    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
  })

  it('does not let a stale session lookup undo a newer sign-out', async () => {
    const pending = deferred<typeof restored>()
    mock.getSession.mockReturnValue(pending.promise)
    renderApp('/account')
    await emit('SIGNED_OUT', null)
    await act(async () => { pending.resolve(restored) })
    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /hello, nimali/i })).not.toBeInTheDocument()
  })

  it('does not let a stale lookup replace a newer sign-in', async () => {
    const pending = deferred<typeof loggedOut>()
    mock.getSession.mockReturnValue(pending.promise)
    renderApp('/login')
    await emit('SIGNED_IN', session)
    await act(async () => { pending.resolve(loggedOut) })
    expect(await screen.findByRole('heading', { name: /hello, nimali/i })).toBeInTheDocument()
  })

  it('does not revive a session when sign-out arrives before login completes', async () => {
    const pending = deferred<typeof restored>()
    mock.signInWithPassword.mockReturnValue(pending.promise)
    renderApp('/login')
    const user = await fillLogin()
    await user.click(screen.getByRole('button', { name: /^log in$/i }))
    await emit('SIGNED_OUT', null)
    await act(async () => { pending.resolve(restored) })
    expect(await screen.findByRole('alert')).toHaveTextContent(/email or password is incorrect/i)
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
  })

  it('unsubscribes on unmount and ignores a pending restoration result', async () => {
    const pending = deferred<typeof restored>()
    mock.getSession.mockReturnValue(pending.promise)
    const view = renderApp('/login')
    expect(mock.listeners.size).toBe(1)
    view.unmount()
    expect(mock.unsubscribe).toHaveBeenCalledTimes(1)
    expect(mock.listeners.size).toBe(0)
    await act(async () => { pending.resolve(restored) })
  })

  it('logs out locally and returns to login', async () => {
    mock.getSession.mockResolvedValue(restored)
    renderApp('/account')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /log out/i }))
    expect(mock.signOut).toHaveBeenCalledExactlyOnceWith({ scope: 'local' })
    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
  })

  it('retains the user and permits retry after logout fails', async () => {
    mock.getSession.mockResolvedValue(restored)
    mock.signOut.mockResolvedValueOnce({ error: { message: 'private logout detail' } })
    renderApp('/account')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /log out/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not log out/i)
    expect(screen.getByRole('heading', { name: /hello, nimali/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log out/i })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: /log out/i }))
    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
  })
})

describe('configuration and service isolation', () => {
  it.each(['supabaseUrl', 'supabasePublishableKey'] as const)('shows a configuration error when %s is missing', async (key) => {
    mock.env[key] = ''
    renderApp('/login')
    expect(await screen.findByRole('alert')).toHaveTextContent(/VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY/)
    expect(screen.getByRole('button', { name: /^log in$/i })).toBeDisabled()
    expect(mock.getSession).not.toHaveBeenCalled()
    expect(mock.signInWithPassword).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: /use demo account/i })).not.toBeInTheDocument()
  })

  it('rejects non-publishable keys and malformed URLs before SDK initialization', () => {
    for (const key of ['server-only-placeholder', 'eyJhbGciOi-placeholder']) {
      mock.env.supabasePublishableKey = key
      expect(() => getSupabaseClient()).toThrow(/public publishable key/)
    }
    mock.env.supabasePublishableKey = 'sb_publishable_test_placeholder'
    mock.env.supabaseUrl = 'not-a-url'
    expect(() => getSupabaseClient()).toThrow(/VITE_SUPABASE_URL/)
    expect(createClient).not.toHaveBeenCalled()
  })

  it('rejects unreplaced example placeholders without initializing the SDK', () => {
    mock.env.supabaseUrl = 'https://YOUR_PROJECT_REF.supabase.co'
    mock.env.supabasePublishableKey = 'sb_publishable_YOUR_PUBLIC_KEY'
    expect(() => getSupabaseClient()).toThrow(/VITE_SUPABASE_URL/)
    expect(createClient).not.toHaveBeenCalled()
  })

  it('offers no real signup from the emergency prompt and never starts a contact call', async () => {
    renderApp('/sos')
    expect(await screen.findByRole('link', { name: /^log in$/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /create account/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /call now/i })).not.toBeInTheDocument()
  })

  it('uses one client with SDK session persistence and refresh', () => {
    expect(getSupabaseClient()).toBe(getSupabaseClient())
    // The mock client has the SDK auth surface; no request has been made.
    expect(mock.signInWithPassword).not.toHaveBeenCalled()
  })

  it('keeps mock data independent and prevents real users from accessing demo contacts', async () => {
    await mockServices.auth.logIn({ email: 'demo@safestep.lk', password: 'anything' })
    expect((await mockServices.contacts.list()).length).toBeGreaterThan(0)
    expect(services.reports).toBe(mockServices.reports)
    expect(services.hotspots).toBe(mockServices.hotspots)
    expect(services.contacts).toBe(apiServices.contacts)
    await expect(services.contacts.list()).rejects.toMatchObject({ kind: 'not-implemented' })
    await expect(services.contacts.add({ name: 'Test', phone: '+94771234567' })).rejects.toMatchObject({ kind: 'not-implemented' })
    expect(selectServices('api', 'demo').auth).toBe(mockServices.auth)
    expect(selectServices('mock', 'supabase').auth).toBe(supabaseAuth)
    expect(selectServices('mock', 'demo').contacts).toBe(mockServices.contacts)
  })
})
