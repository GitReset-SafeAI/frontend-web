import { z } from 'zod'

import { env } from '../../config/env'
import { ApiError } from '../api/ApiError'
import { createApiClient } from '../api/client'
import type { LogInInput } from '../contracts/account'

const sessionSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  token_type: z.literal('bearer'),
  expires_in: z.number().int().positive(),
})

export async function signIn(input: LogInInput) {
  try {
    // Vite forwards /api locally; production can use a configured API origin.
    const baseUrl = import.meta.env.DEV ? '/' : (env.apiBaseUrl || '/')
    return await createApiClient(baseUrl, 15_000).request(
      '/api/v1/authentication/sign-in', sessionSchema, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: input.email.trim(), password: input.password }),
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'error',
      },
    )
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) throw new ApiError('invalid-credentials', 'Invalid email or password.')
      if (error.status === 403) throw new ApiError('email-unconfirmed', 'Confirm your email before logging in.')
      if (error.status === 429) throw new ApiError('rate-limit', 'Too many attempts. Try again later.')
      if (error.status === 503) throw new ApiError('network', 'Authentication could not be reached.')
    }
    throw error
  }
}
