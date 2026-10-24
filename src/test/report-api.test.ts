import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mock = vi.hoisted(() => ({
  getSession: vi.fn(),
  fetch: vi.fn(),
  env: {
    authMode: 'supabase', dataMode: 'mock', apiBaseUrl: 'http://backend.test',
    supabasePublishableKey: 'sb_publishable_test_only',
  },
}))
vi.mock('../config/env', () => ({ env: mock.env }))
vi.mock('../services/auth/supabaseClient', () => ({
  getSupabaseClient: () => ({ auth: { getSession: mock.getSession } }),
}))

import { services, selectServices } from '../services'
import { apiServices } from '../services/api'
import { submitReport } from '../services/api/reports'
import type { ReportSubmission } from '../services/contracts'
import { mockServices } from '../services/mocks'

const submission: ReportSubmission = {
  description: '  Synthetic report for a mocked transport check.  ',
  inputMethod: 'typed', language_hint: 'en',
}
const persisted = {
  id: '11111111-1111-4111-8111-111111111111',
  submitted_at: '2026-01-01T12:00:00Z',
  original_text: submission.description,
  translated_text: 'Synthetic report for a mocked transport check.',
  input_method: 'text', language_hint: 'en', reported_time: 'evening',
  latitude: null, longitude: null, occurred_at: null, lighting_condition: null,
  current_safety_status: null, RAPID_SUBMISSIONS: true,
}
const validSession = () => ({
  data: { session: {
    user: { id: 'mock-user' }, access_token: 'mock-user-access-token',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  } }, error: null,
})

beforeEach(() => {
  vi.clearAllMocks()
  mock.env.apiBaseUrl = 'http://backend.test'
  mock.getSession.mockResolvedValue(validSession())
  mock.fetch.mockResolvedValue(new Response(JSON.stringify(persisted), { status: 201 }))
  vi.stubGlobal('fetch', mock.fetch)
})
afterEach(() => { vi.unstubAllGlobals() })

describe('authenticated report transport (all requests mocked)', () => {
  it('sends the user session token and exact core payload, then retains the persisted UUID and boolean signal', async () => {
    const receipt = await submitReport(submission)
    expect(receipt.report.id).toBe(persisted.id)
    expect(receipt.report.RAPID_SUBMISSIONS).toBe(true)
    expect(receipt.demoAnalysis).toBeUndefined()
    expect(mock.fetch).toHaveBeenCalledExactlyOnceWith('http://backend.test/api/v1/reports', expect.objectContaining({
      method: 'POST', credentials: 'omit', redirect: 'error',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock-user-access-token' },
    }))
    expect(JSON.parse(mock.fetch.mock.calls[0][1].body)).toEqual({
      original_text: submission.description, input_method: 'text', language_hint: 'en',
    })
  })

  it('maps voice and optional context and omits unanswered values', async () => {
    await submitReport({
      ...submission, inputMethod: 'voice', language_hint: 'si-Latn',
      location: { latitude: 6.9, longitude: 79.8, source: 'device' },
      occurred_at: '2026-01-01T12:00:00+05:30', reported_time: 'evening',
      lighting_condition: 'DAYLIGHT', current_safety_status: 'SAFE_NOW',
    })
    expect(JSON.parse(mock.fetch.mock.calls[0][1].body)).toEqual({
      original_text: submission.description, input_method: 'voice', language_hint: 'si-Latn',
      latitude: 6.9, longitude: 79.8, occurred_at: '2026-01-01T12:00:00+05:30',
      reported_time: 'evening', lighting_condition: 'DAYLIGHT', current_safety_status: 'SAFE_NOW',
    })
  })

  it.each(['missing', 'expired', 'publishable'] as const)('rejects a %s session before sending anything', async (kind) => {
    if (kind === 'missing') mock.getSession.mockResolvedValue({ data: { session: null }, error: null })
    else {
      const result = validSession()
      if (kind === 'expired') result.data.session.expires_at = 1
      else result.data.session.access_token = mock.env.supabasePublishableKey
      mock.getSession.mockResolvedValue(result)
    }
    await expect(submitReport(submission)).rejects.toMatchObject({ kind: 'unauthorized' })
    expect(mock.fetch).not.toHaveBeenCalled()
  })

  it.each([
    [401, 'unauthorized'], [403, 'forbidden'], [422, 'validation'],
    [429, 'rate-limit'], [500, 'unknown'], [200, 'unknown'],
  ])('handles HTTP %i without retrying or depending on response error contents', async (status, kind) => {
    mock.fetch.mockResolvedValue(new Response('private server detail', { status }))
    await expect(submitReport(submission)).rejects.toMatchObject({ kind })
    expect(mock.fetch).toHaveBeenCalledTimes(1)
  })

  it('handles network failure without exposing raw failure details', async () => {
    mock.fetch.mockRejectedValue(new TypeError('private network detail'))
    await expect(submitReport(submission)).rejects.toMatchObject({ kind: 'network' })
    expect(mock.fetch).toHaveBeenCalledTimes(1)
  })

  it.each([
    { ...persisted, id: 123 },
    { ...persisted, RAPID_SUBMISSIONS: 'true' },
  ])('distinguishes invalid HTTP 201 confirmation details from failed creation', async (body) => {
    mock.fetch.mockResolvedValue(new Response(JSON.stringify(body), { status: 201 }))
    await expect(submitReport(submission)).rejects.toMatchObject({ kind: 'confirmation' })
    expect(mock.fetch).toHaveBeenCalledTimes(1)
  })

  it('handles unreadable HTTP 201 confirmation without auto-resubmission', async () => {
    mock.fetch.mockResolvedValue(new Response('not JSON', { status: 201 }))
    await expect(submitReport(submission)).rejects.toMatchObject({ kind: 'confirmation' })
    expect(mock.fetch).toHaveBeenCalledTimes(1)
  })

  it('rejects invalid report fields or API configuration before sending', async () => {
    await expect(submitReport({ ...submission, description: ' ' })).rejects.toMatchObject({ kind: 'validation' })
    mock.env.apiBaseUrl = 'not a URL'
    await expect(submitReport(submission)).rejects.toMatchObject({ kind: 'configuration' })
    expect(mock.fetch).not.toHaveBeenCalled()
  })

  it('routes only real report creation to FastAPI while preserving other mock-backed services', () => {
    expect(services.reports.submitReport).toBe(apiServices.reports.submitReport)
    expect(services.reports.transcribeVoice).toBe(mockServices.reports.transcribeVoice)
    expect(services.hotspots).toBe(mockServices.hotspots)
    expect(selectServices('mock', 'demo').reports.submitReport).toBe(mockServices.reports.submitReport)
  })
})
