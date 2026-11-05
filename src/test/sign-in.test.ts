import { afterEach, describe, expect, it, vi } from 'vitest'

import { signIn } from '../services/auth/signIn'

afterEach(() => { vi.unstubAllGlobals() })

describe('backend sign-in', () => {
  it('posts credentials to the backend and validates the session', async () => {
    const tokens = { access_token: 'access', refresh_token: 'refresh', token_type: 'bearer', expires_in: 3600 }
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(tokens)))
    vi.stubGlobal('fetch', fetch)
    await expect(signIn({ email: ' person@example.com ', password: ' secret ' })).resolves.toEqual(tokens)
    expect(fetch).toHaveBeenCalledWith('/api/v1/authentication/sign-in', expect.objectContaining({
      method: 'POST', cache: 'no-store', credentials: 'omit',
      body: JSON.stringify({ email: 'person@example.com', password: ' secret ' }),
    }))
  })

  it.each([[401, 'invalid-credentials'], [403, 'email-unconfirmed'], [429, 'rate-limit'], [503, 'network']])(
    'maps HTTP %s without displaying provider details', async (status, kind) => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('private provider detail', { status: Number(status) })))
      await expect(signIn({ email: 'person@example.com', password: 'secret' })).rejects.toMatchObject({ kind })
    },
  )

  it('rejects a malformed successful response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')))
    await expect(signIn({ email: 'person@example.com', password: 'secret' })).rejects.toMatchObject({ kind: 'invalid-response' })
  })

  it('handles network failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('private network detail')))
    await expect(signIn({ email: 'person@example.com', password: 'secret' })).rejects.toMatchObject({ kind: 'network' })
  })
})
