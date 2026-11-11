import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mock = vi.hoisted(() => ({
  getSession: vi.fn(),
  setSession: vi.fn(),
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
vi.mock('../services/auth/signIn', () => ({
  signIn: vi.fn(async () => ({
    access_token: 'mock-access-token', refresh_token: 'mock-refresh-token',
    token_type: 'bearer', expires_in: 3600,
  })),
}))
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ auth: {
    getSession: mock.getSession,
    setSession: mock.setSession,
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

vi.mock('../features/emergency/phoneCall', () => ({ openPhoneCall: vi.fn() }))

vi.mock('../features/emergency/sms', async (importOriginal) => ({
  ...await importOriginal<typeof import('../features/emergency/sms')>(), openSmsDraft: vi.fn(),
}))
import { openSmsDraft } from '../features/emergency/sms'
import { openPhoneCall } from '../features/emergency/phoneCall'
import { createClient } from '@supabase/supabase-js'
import { services, selectServices } from '../services'
import { apiServices } from '../services/api'
import { ApiError } from '../services/api/ApiError'
import { mockServices } from '../services/mocks'
import { supabaseAuth } from '../services/auth/supabaseAuth'
import { getSupabaseClient } from '../services/auth/supabaseClient'
import { signIn } from '../services/auth/signIn'
import { renderApp } from './renderApp'

const realUser: User = {
  id: 'real-user', email: 'person@example.com', user_metadata: { name: 'Nimali' },
  app_metadata: {}, aud: 'authenticated', created_at: '2026-01-01T00:00:00Z',
}
const session: Session = {
  user: realUser, access_token: 'mock-access-token', refresh_token: 'mock-refresh-token',
  expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer',
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
  mock.setSession.mockResolvedValue(restored)
  mock.signOut.mockResolvedValue({ error: null })
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response('[]', { status: 200 })))
})

afterEach(() => { vi.unstubAllGlobals() })

describe('Supabase password login', () => {
  it('logs in through the existing form and preserves its home redirect', async () => {
    renderApp('/login')
    const user = await fillLogin()
    await user.click(screen.getByRole('button', { name: /^log in$/i }))
    expect(await screen.findByRole('heading', { name: /know what has been reported/i })).toBeInTheDocument()
    expect(mock.setSession).toHaveBeenCalledExactlyOnceWith({ access_token: 'mock-access-token', refresh_token: 'mock-refresh-token' })
    expect(signIn).toHaveBeenCalledExactlyOnceWith({ email: 'person@example.com', password: 'test-password' })
    expect(createClient).toHaveBeenCalledWith(mock.env.supabaseUrl, mock.env.supabasePublishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
    expect(screen.getByRole('link', { name: /your account, nimali/i })).toBeInTheDocument()
  })

  it('shows a backend credential rejection without installing a session', async () => {
    vi.mocked(signIn).mockRejectedValueOnce(new ApiError('invalid-credentials', 'Invalid email or password.'))
    renderApp('/login')
    const user = await fillLogin()
    await user.click(screen.getByRole('button', { name: /^log in$/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/email or password is incorrect/i)
    expect(mock.setSession).not.toHaveBeenCalled()
  })

  it.each([
    [{ code: 'invalid_credentials' }, /email or password is incorrect/i],
    [{ code: 'email_not_confirmed' }, /confirm your email/i],
    [{ status: 429 }, /too many attempts/i],
    [{ name: 'AuthRetryableFetchError' }, /unable to reach authentication/i],
    [{ code: 'provider_failure', message: 'private provider detail' }, /something went wrong/i],
  ])('maps provider failure %j without exposing provider messages', async (error, message) => {
    mock.setSession.mockResolvedValue({ data: { session: null }, error })
    renderApp('/login')
    const user = await fillLogin()
    await user.click(screen.getByRole('button', { name: /^log in$/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.queryByText(/private provider detail/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^log in$/i })).toBeEnabled()
  })

  it('handles rejected network requests', async () => {
    mock.setSession.mockRejectedValue(new TypeError('private network detail'))
    renderApp('/login')
    const user = await fillLogin()
    await user.click(screen.getByRole('button', { name: /^log in$/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/unable to reach authentication/i)
  })

  it('shows registration without demo controls in real mode', async () => {
    renderApp('/login?mode=signup')
    await waitFor(() => { expect(screen.getByLabelText('Your name')).toBeEnabled() })
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument()
    expect(screen.queryByText(/demo sign-in/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /use demo account/i })).not.toBeInTheDocument()
  })

  it('registers through the backend and returns to login', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))
    try {
      renderApp('/login?mode=signup')
      const user = userEvent.setup()
      await waitFor(() => { expect(screen.getByLabelText('Your name')).toBeEnabled() })
      await user.type(screen.getByLabelText('Your name'), 'Nimali')
      await user.type(screen.getByLabelText('Phone number'), '0771234567')
      await user.type(screen.getByLabelText('NIC number'), '200012300123')
      await user.type(screen.getByLabelText('Email'), 'person@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.click(screen.getByRole('button', { name: /^create account$/i }))
      expect(await screen.findByText(/check your email for a confirmation link/i)).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
      expect(fetchMock).toHaveBeenCalledWith('/api/v1/authentication/sign-up', expect.objectContaining({
        method: 'POST', body: JSON.stringify({ name: 'Nimali', email: 'person@example.com', password: 'password123', nic: '200012300123', phone_number: '+94771234567' }),
      }))
    } finally { fetchMock.mockRestore() }
  })

  it('disables the form during login and prevents repeated requests', async () => {
    const pending = deferred<typeof restored>()
    mock.setSession.mockReturnValue(pending.promise)
    renderApp('/login')
    const user = await fillLogin()
    await user.dblClick(screen.getByRole('button', { name: /^log in$/i }))
    expect(mock.setSession).toHaveBeenCalledTimes(1)
    expect(screen.getByLabelText('Email')).toBeDisabled()
    expect(screen.getByLabelText('Password')).toBeDisabled()
    expect(screen.getByRole('button', { name: /^log in$/i })).toHaveAttribute('aria-busy', 'true')
    await act(async () => { pending.resolve(restored) })
    expect(await screen.findByRole('heading', { name: /know what has been reported/i })).toBeInTheDocument()
  })
})

describe('session lifecycle and redirects', () => {
  it('preserves the report draft and permits login again after a rejected backend session, even with a cached user', async () => {
    mock.getSession.mockResolvedValue(restored)
    const report = vi.spyOn(services.reports, 'submitReport').mockRejectedValue(new ApiError('unauthorized', 'Mock rejected session'))
    try {
      renderApp('/report')
      const user = userEvent.setup()
      const description = 'Synthetic description retained while logging in again.'
      await user.type(screen.getByRole('textbox', { name: /describe the incident/i }), description)
      await user.click(screen.getByRole('button', { name: /^next$/i }))
      await user.click(screen.getByRole('button', { name: /^skip$/i }))
      await user.click(screen.getByRole('button', { name: /^skip$/i }))
      await user.click(screen.getByRole('button', { name: /submit report/i }))
      expect(await screen.findByRole('alert')).toHaveTextContent(/session is missing, expired, or was rejected/i)
      expect(screen.getByText(description)).toBeInTheDocument()
      await user.click(screen.getByRole('link', { name: /log in again/i }))
      expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
      await fillLogin()
      await user.click(screen.getByRole('button', { name: /^log in$/i }))
      expect(await screen.findByRole('heading', { name: /review and submit/i })).toBeInTheDocument()
      expect(screen.getByText(description)).toBeInTheDocument()
      expect(report).toHaveBeenCalledTimes(1)
    } finally { report.mockRestore() }
  })

  it('accepts a safe return destination after login', async () => {
    renderApp('/login', { state: { from: '/safety' } })
    const user = await fillLogin()
    await user.click(screen.getByRole('button', { name: /^log in$/i }))
    expect(await screen.findByTestId('safety-map')).toBeInTheDocument()
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
    queryClient.setQueryData(['contacts', realUser.id], [{ id: 'private-1', name: 'Private contact', phone: '+94771234567' }])
    await emit('TOKEN_REFRESHED', session)
    expect(queryClient.getQueryData(['contacts', realUser.id])).toBeDefined()
    await emit('SIGNED_IN', { ...session, user: { ...realUser, id: 'another-user' } })
    expect(queryClient.getQueryData(['contacts', realUser.id])).toBeUndefined()
    queryClient.setQueryData(['contacts', 'another-user'], [{ id: 'private-2', name: 'Another private contact', phone: '+94777654321' }])
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
    expect(await screen.findByRole('button', { name: /^add a contact$/i })).toBeEnabled()
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
    mock.setSession.mockReturnValue(pending.promise)
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
    expect(mock.setSession).not.toHaveBeenCalled()
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
    expect(mock.setSession).not.toHaveBeenCalled()
  })

  it('keeps mock data independent and prevents real users from accessing demo contacts', async () => {
    await mockServices.auth.logIn({ email: 'demo@safestep.lk', password: 'anything' })
    expect((await mockServices.contacts.list()).length).toBeGreaterThan(0)
    expect(services.reports.submitReport).toBe(apiServices.reports.submitReport)
    expect(services.reports.transcribeVoice).toBe(apiServices.reports.transcribeVoice)
    expect(services.safetyMap).toBe(mockServices.safetyMap)
    expect(services.contacts).toBe(apiServices.contacts)
    await expect(services.contacts.list()).rejects.toMatchObject({ kind: 'unauthorized' })
    await expect(services.contacts.add({ name: 'Test', phone: '+94771234567' })).rejects.toMatchObject({ kind: 'unauthorized' })
    expect(selectServices('api', 'demo').auth).toBe(mockServices.auth)
    expect(selectServices('mock', 'supabase').auth).toBe(supabaseAuth)
    expect(selectServices('mock', 'demo').contacts).toBe(mockServices.contacts)
  })
})


describe('real emergency contacts', () => {
  it('adds a contact directly from Emergency and reloads it from the backend', async () => {
    mock.getSession.mockResolvedValue(restored)
    const rows: { id: string; name: string; phone: string; slot: number }[] = []
    const fetchMock = vi.fn().mockImplementation(async (_url: string, options: RequestInit) => {
      if (options.method === 'POST') {
        const input = JSON.parse(options.body as string)
        const contact = { id: 'contact-1', slot: 0, ...input }
        rows.push(contact)
        return new Response(JSON.stringify(contact), { status: 201 })
      }
      return new Response(JSON.stringify(rows), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)
    const view = renderApp('/emergency')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /^add a contact$/i }))
    await user.type(screen.getByLabelText(/^name$/i), 'Amma')
    await user.type(screen.getByLabelText(/^phone number$/i), '077 123 4567')
    await user.click(screen.getByRole('button', { name: /^save contact$/i }))
    expect(await screen.findByRole('link', { name: /call amma/i })).toHaveAttribute('href', 'tel:+94771234567')
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/emergency-contacts', expect.objectContaining({
      method: 'POST', credentials: 'omit', cache: 'no-store',
      body: JSON.stringify({ name: 'Amma', phone: '+94771234567' }),
    }))
    const postOptions = fetchMock.mock.calls.find(([, options]) => options.method === 'POST')?.[1]
    expect(postOptions.headers.get('Authorization')).toBe('Bearer mock-access-token')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    view.unmount()
    renderApp('/emergency')
    expect(await screen.findByRole('link', { name: /call amma/i })).toHaveAttribute('href', 'tel:+94771234567')
    expect(screen.queryByText(/saved only in this browser/i)).not.toBeInTheDocument()
  })

  it('keeps the entered contact in the form when saving fails', async () => {
    mock.getSession.mockResolvedValue(restored)
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url: string, options: RequestInit) =>
      options.method === 'POST' ? new Response('{}', { status: 503 }) : new Response('[]', { status: 200 })))
    renderApp('/emergency')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /^add a contact$/i }))
    await user.type(screen.getByLabelText(/^name$/i), 'Amma')
    await user.type(screen.getByLabelText(/^phone number$/i), '0771234567')
    await user.click(screen.getByRole('button', { name: /^save contact$/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't save/i)
    expect(screen.getByLabelText(/^phone number$/i)).toHaveValue('0771234567')
    expect(screen.getByRole('button', { name: /^save contact$/i })).toBeEnabled()
    expect(screen.queryByRole('link', { name: /call amma/i })).not.toBeInTheDocument()
  })
})


describe('slot-zero SOS calls', () => {
  it('targets slot zero even when another contact is returned first', async () => {
    mock.getSession.mockResolvedValue(restored)
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response(JSON.stringify([
      { id: 'slot-two', slot: 2, name: 'Other', phone: '+94777654321' },
      { id: 'slot-zero', slot: 0, name: 'Amma', phone: '+94771234567' },
    ]), { status: 200 })))
    renderApp('/emergency')
    const user = userEvent.setup()
    await screen.findByRole('link', { name: /call amma/i })
    await user.click(screen.getByRole('button', { name: /sos\. emergency help/i }))
    expect(await screen.findByRole('heading', { name: /how would you like to get help/i })).toBeInTheDocument()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    expect(openPhoneCall).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: /^call$/i }))
    expect(openPhoneCall).toHaveBeenCalledExactlyOnceWith('+94771234567')
  })

  it('does not open the dialer or substitute another contact when slot zero is absent', async () => {
    mock.getSession.mockResolvedValue(restored)
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response(JSON.stringify([
      { id: 'slot-two', slot: 2, name: 'Other', phone: '+94777654321' },
    ]), { status: 200 })))
    renderApp('/sos')
    expect(await screen.findByRole('heading', { name: /add an emergency contact first/i })).toBeInTheDocument()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    expect(openPhoneCall).not.toHaveBeenCalled()
  })
})

describe('prefilled emergency SMS with location', () => {
  const contact = { id: 'contact-0', slot: 0, name: 'Amma', phone: '+94771234567' }
  const other = { id: 'contact-1', slot: 1, name: 'Kasun', phone: '+94777654321' }
  const geolocationDescriptor = Object.getOwnPropertyDescriptor(navigator, 'geolocation')
  const shareId = 'a'.repeat(43)
  const fix = { coords: { latitude: 6.92, longitude: 79.86, accuracy: 12 } }
  let watchUpdate: PositionCallback
  let clearWatch: ReturnType<typeof vi.fn>
  let rows: Record<string, unknown>
  let apiFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mock.getSession.mockResolvedValue(restored)
    vi.stubGlobal('isSecureContext', true)
    clearWatch = vi.fn()
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: {
      getCurrentPosition: vi.fn((success) => success(fix)),
      watchPosition: vi.fn((success) => { watchUpdate = success; return 42 }),
      clearWatch,
    } })
    rows = { share_id: shareId, position: { latitude: 6.92, longitude: 79.86 }, accuracy_m: 12,
      updated_at: new Date().toISOString(), expires_at: new Date(Date.now() + 1_800_000).toISOString() }
    apiFetch = vi.fn().mockImplementation(async (url: string, options: RequestInit) => {
      if (url === '/api/v1/emergency-contacts') return new Response(JSON.stringify([contact, other]), { status: 200 })
      if (options.method === 'DELETE') return new Response(null, { status: 204 })
      return new Response(JSON.stringify(rows), { status: options.method === 'POST' ? 201 : 200 })
    })
    vi.stubGlobal('fetch', apiFetch)
  })
  afterEach(() => {
    if (geolocationDescriptor) Object.defineProperty(navigator, 'geolocation', geolocationDescriptor)
    else Reflect.deleteProperty(navigator, 'geolocation')
    vi.restoreAllMocks()
  })

  it('prefills the selected number and fixed SOS text with a working read-only tracking URL', async () => {
    renderApp('/sos')
    const user = userEvent.setup()
    await screen.findByRole('button', { name: /^send location$/i })
    expect(openSmsDraft).not.toHaveBeenCalled()
    expect(apiFetch.mock.calls.some(([, options]) => options.method === 'POST')).toBe(false)
    await user.selectOptions(screen.getByRole('combobox', { name: /emergency contact/i }), other.id)
    await user.click(screen.getByRole('button', { name: /^send location$/i }))
    await waitFor(() => { expect(openSmsDraft).toHaveBeenCalledTimes(1) })
    expect(openSmsDraft).toHaveBeenCalledWith(other.phone, expect.stringContaining('SOS: I may be in danger.'))
    const message = vi.mocked(openSmsDraft).mock.calls[0][1]
    expect(message).toContain('/track/' + shareId)
    expect(message).not.toContain('mock-access-token')
    expect(message).not.toContain('owner')
    expect(screen.getByLabelText(/message preview/i)).toHaveValue(message)
    const [, request] = apiFetch.mock.calls.find(([url, options]) =>
      url === '/api/v1/emergency-location-shares' && options.method === 'POST')!
    expect(JSON.parse(request.body)).toEqual({ position: { latitude: 6.92, longitude: 79.86 }, accuracy_m: 12 })
    expect(request.headers.get('Authorization')).toBe('Bearer mock-access-token')
    expect(openPhoneCall).not.toHaveBeenCalled()
    expect(screen.getByText(/press Send in your Messages app/i)).toBeInTheDocument()
  })

  it('updates the shared location and revokes it when Stop sharing is chosen', async () => {
    renderApp('/sos')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /^send location$/i }))
    await screen.findByRole('button', { name: /stop sharing location/i })
    const realNow = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(realNow + 11_000)
    await act(async () => { watchUpdate({ coords: { latitude: 6.93, longitude: 79.87, accuracy: 8 } } as GeolocationPosition) })
    await waitFor(() => { expect(apiFetch.mock.calls.some(([, options]) => options.method === 'PATCH')).toBe(true) })
    await user.click(screen.getByRole('button', { name: /stop sharing location/i }))
    await waitFor(() => { expect(screen.queryByRole('button', { name: /stop sharing location/i })).not.toBeInTheDocument() })
    expect(clearWatch).toHaveBeenCalledWith(42)
    expect(apiFetch.mock.calls.some(([, options]) => options.method === 'DELETE')).toBe(true)
  })

  it('does not open an SMS or publish a location when GPS permission is denied', async () => {
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: {
      getCurrentPosition: vi.fn((_success, failure) => failure({ code: 1 })),
      clearWatch,
    } })
    renderApp('/sos')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /^send location$/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/Location is unavailable/i)
    expect(openSmsDraft).not.toHaveBeenCalled()
    expect(apiFetch.mock.calls.some(([, options]) => options.method === 'POST')).toBe(false)
  })

  it('does not open SMS when creating a tracking link fails', async () => {
    apiFetch.mockImplementation(async (url: string) => url === '/api/v1/emergency-contacts'
      ? new Response(JSON.stringify([contact]), { status: 200 }) : new Response('{}', { status: 503 }))
    renderApp('/sos')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /^send location$/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/sharing could not be updated/i)
    expect(openSmsDraft).not.toHaveBeenCalled()
  })

  it('lets a recipient open the tracker in a browser without logging in', async () => {
    mock.getSession.mockResolvedValue(loggedOut)
    renderApp('/track/' + shareId)
    expect(await screen.findByTestId('emergency-location-map')).toBeInTheDocument()
    expect(screen.getByText(/Last updated:/i)).toBeInTheDocument()
    const [, request] = apiFetch.mock.calls.find(([url]) => url.includes('/emergency-location-shares/'))!
    expect(request.headers.has('Authorization')).toBe(false)
  })
})
