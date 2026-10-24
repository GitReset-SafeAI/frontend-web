import type { User as SupabaseUser } from '@supabase/supabase-js'

import { ApiError } from '../api/ApiError'
import type { AuthService, User } from '../contracts'
import { getSupabaseClient } from './supabaseClient'

function mapUser(user: SupabaseUser | undefined): User | null {
  if (!user) return null
  const name = user.user_metadata?.name ?? user.user_metadata?.full_name
  return {
    id: user.id,
    email: user.email ?? '',
    name: typeof name === 'string' && name.trim() ? name.trim() : (user.email?.split('@')[0] || 'User'),
  }
}

// Keep provider messages, credentials, and tokens out of UI errors.
export function toAuthError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  const details = error as { code?: string; status?: number; name?: string } | null
  if (details?.code === 'invalid_credentials') return new ApiError('invalid-credentials', 'Invalid email or password.')
  if (details?.code === 'email_not_confirmed') return new ApiError('email-unconfirmed', 'Confirm your email before logging in.')
  if (details?.status === 429 || details?.code === 'over_request_rate_limit') return new ApiError('rate-limit', 'Too many attempts. Try again later.')
  if (details?.name === 'AuthRetryableFetchError' || error instanceof TypeError) return new ApiError('network', 'Authentication could not be reached.')
  return new ApiError('unknown', 'Authentication could not be completed. Please try again.')
}

export const supabaseAuth: AuthService = {
  async getSession() {
    try {
      const { data, error } = await getSupabaseClient().auth.getSession()
      if (error) throw error
      return mapUser(data.session?.user)
    } catch (error) { throw toAuthError(error) }
  },
  async logIn({ email, password }) {
    try {
      const { data, error } = await getSupabaseClient().auth.signInWithPassword({ email: email.trim(), password })
      if (error) throw error
      const user = mapUser(data.session?.user)
      if (!user) throw new ApiError('unauthorized', 'No authenticated session was returned.')
      return user
    } catch (error) { throw toAuthError(error) }
  },
  async logOut() {
    try {
      const { error } = await getSupabaseClient().auth.signOut({ scope: 'local' })
      if (error) throw error
    } catch (error) { throw toAuthError(error) }
  },
  async signUp() {
    throw new ApiError('not-implemented', 'Real signup is not available in this phase.')
  },
  subscribe(listener) {
    try {
      const { data } = getSupabaseClient().auth.onAuthStateChange((event, session) => {
        // getSession owns initialization (including its error). Later events win
        // over that snapshot in AuthProvider, so an old snapshot cannot revive a session.
        if (event === 'INITIAL_SESSION') return
        listener(mapUser(session?.user))
      })
      return () => { data.subscription.unsubscribe() }
    } catch (error) { throw toAuthError(error) }
  },
}
