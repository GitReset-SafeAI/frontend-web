import { z } from 'zod'
import { env } from '../../config/env'
import { getSupabaseAccessToken } from '../auth/supabaseSession'
import { coordinateSchema } from '../contracts/safetyMap'
import { createApiClient } from './client'

const locationSchema = z.object({
  share_id: z.string().min(1), position: coordinateSchema,
  accuracy_m: z.number().nonnegative(),
  updated_at: z.iso.datetime(), expires_at: z.iso.datetime(),
})
export type SharedEmergencyLocation = z.infer<typeof locationSchema>
export type LocationFix = { position: { latitude: number; longitude: number }; accuracy_m: number }
const endpoint = '/api/v1/emergency-location-shares'
function client() { return createApiClient(import.meta.env.DEV ? '/' : (env.apiBaseUrl || '/'), 15_000) }
async function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await getSupabaseAccessToken() }
}
export const emergencyLocation = {
  async start(fix: LocationFix) {
    return client().request(endpoint, locationSchema, {
      method: 'POST', headers: await authHeaders(), body: JSON.stringify(fix),
      credentials: 'omit', cache: 'no-store', redirect: 'error',
    })
  },
  async update(id: string, fix: LocationFix) {
    return client().request(endpoint + '/' + encodeURIComponent(id), locationSchema, {
      method: 'PATCH', headers: await authHeaders(), body: JSON.stringify(fix),
      credentials: 'omit', cache: 'no-store', redirect: 'error', keepalive: true,
    })
  },
  async end(id: string) {
    await client().request(endpoint + '/' + encodeURIComponent(id), z.undefined(), {
      method: 'DELETE', headers: await authHeaders(),
      credentials: 'omit', cache: 'no-store', redirect: 'error', keepalive: true,
    })
  },
  async read(id: string) {
    return client().request(endpoint + '/' + encodeURIComponent(id), locationSchema, {
      credentials: 'omit', cache: 'no-store', redirect: 'error',
    })
  },
}
