import { z } from 'zod'

import { env } from '../../config/env'
import { getSupabaseAccessToken } from '../auth/supabaseSession'
import type { ContactService } from '../contracts/account'
import { emergencyContactSchema } from '../contracts/account'
import { ApiError } from './ApiError'
import { createApiClient } from './client'

const savedContactSchema = emergencyContactSchema.extend({ slot: z.number().int().min(0).max(4) })

async function request<T>(path: string, schema: z.ZodType<T>, method = 'GET', body?: unknown): Promise<T> {
  const token = await getSupabaseAccessToken()
  const baseUrl = import.meta.env.DEV ? '/' : (env.apiBaseUrl || '/')
  try {
    return await createApiClient(baseUrl).request(`/api/v1/emergency-contacts${path}`, schema, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      credentials: 'omit', cache: 'no-store', redirect: 'error',
    })
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      throw new ApiError('limit', 'You can save up to five emergency contacts.', 409)
    }
    throw error
  }
}

export const contacts: ContactService = {
  list: () => request('', z.array(savedContactSchema)),
  add: (input) => request('', savedContactSchema, 'POST', input),
  update: (id, input) => request(`/${encodeURIComponent(id)}`, savedContactSchema, 'PATCH', input),
  remove: (id) => request(`/${encodeURIComponent(id)}`, z.undefined(), 'DELETE'),
  makePrimary: (id) => request(`/${encodeURIComponent(id)}/primary`, z.undefined(), 'POST'),
}
