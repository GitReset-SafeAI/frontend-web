import { env } from '../../config/env'
import { ApiError } from '../api/ApiError'
import { getSupabaseClient } from './supabaseClient'

// Tokens stay at the service boundary, never in form state, URLs, or logs.
export async function getSupabaseAccessToken(): Promise<string> {
  if (env.authMode !== 'supabase') {
    throw new ApiError('unauthorized', 'Log in with a real account before submitting a report.')
  }
  try {
    // The SDK refreshes a session when possible before returning it.
    const { data, error } = await getSupabaseClient().auth.getSession()
    const session = data.session
    if (error || !session?.user || !session.access_token
      || !session.expires_at || !Number.isFinite(session.expires_at) || session.expires_at * 1000 <= Date.now()
      || session.access_token === env.supabasePublishableKey
      || session.access_token.startsWith('sb_publishable_')) {
      throw new ApiError('unauthorized', 'Your session is missing or expired. Log in again; your report draft is preserved.')
    }
    return session.access_token
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError('unauthorized', 'Your session could not be restored. Log in again; your report draft is preserved.')
  }
}
