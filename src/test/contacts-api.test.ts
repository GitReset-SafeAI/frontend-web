import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mock = vi.hoisted(() => ({ token: vi.fn(), fetch: vi.fn() }))
vi.mock('../config/env', () => ({ env: { authMode: 'supabase', apiBaseUrl: 'http://backend.test' } }))
vi.mock('../services/auth/supabaseSession', () => ({ getSupabaseAccessToken: mock.token }))
import { contacts } from '../services/api/contacts'
import { ApiError } from '../services/api/ApiError'

const contact = { id: 'contact-1', slot: 0, name: 'Amma', phone: '+94771234567' }
beforeEach(() => {
  vi.clearAllMocks()
  mock.token.mockResolvedValue('user-access-token')
  mock.fetch.mockImplementation(async () => new Response(JSON.stringify(contact), { status: 200 }))
  vi.stubGlobal('fetch', mock.fetch)
})
afterEach(() => { vi.unstubAllGlobals() })

describe('private contact transport', () => {
  it('lists contacts with the access token', async () => {
    mock.fetch.mockResolvedValue(new Response(JSON.stringify([contact]), { status: 200 }))
    expect(await contacts.list()).toEqual([contact])
    const [url, options] = mock.fetch.mock.calls[0]
    expect(url).toBe('/api/v1/emergency-contacts')
    expect(options.headers.get('Authorization')).toBe('Bearer user-access-token')
    expect(options.credentials).toBe('omit')
    expect(options.cache).toBe('no-store')
  })

  it('supports add, update, remove, and primary selection', async () => {
    const input = { name: contact.name, phone: contact.phone }
    await contacts.add(input)
    await contacts.update(contact.id, input)
    mock.fetch.mockImplementation(async () => new Response(null, { status: 204 }))
    await contacts.remove(contact.id)
    await contacts.makePrimary(contact.id)
    expect(mock.fetch.mock.calls.map(([url, options]) => [url, options.method])).toEqual([
      ['/api/v1/emergency-contacts', 'POST'],
      ['/api/v1/emergency-contacts/contact-1', 'PATCH'],
      ['/api/v1/emergency-contacts/contact-1', 'DELETE'],
      ['/api/v1/emergency-contacts/contact-1/primary', 'POST'],
    ])
    expect(JSON.parse(mock.fetch.mock.calls[0][1].body)).toEqual(input)
  })

  it('does not send requests without a valid session', async () => {
    mock.token.mockRejectedValue(new ApiError('unauthorized', 'Expired'))
    await expect(contacts.list()).rejects.toMatchObject({ kind: 'unauthorized' })
    expect(mock.fetch).not.toHaveBeenCalled()
  })

  it('maps the contact limit and rejects malformed responses', async () => {
    mock.fetch.mockResolvedValueOnce(new Response('{}', { status: 409 }))
    await expect(contacts.add(contact)).rejects.toMatchObject({ kind: 'limit' })
    mock.fetch.mockResolvedValueOnce(new Response('[{"private":"bad"}]', { status: 200 }))
    await expect(contacts.list()).rejects.toMatchObject({ kind: 'invalid-response' })
  })
})
