import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { env } from '../../config/env'
import { ApiError } from '../api/ApiError'

let client: SupabaseClient | undefined

// Lazy initialization keeps demo mode usable without any Supabase configuration.
// Never include supplied values in configuration errors or logs.
export function getSupabaseClient(): SupabaseClient {
  const { supabaseUrl, supabasePublishableKey } = env
  let validUrl = false
  try {
    const url = new URL(supabaseUrl ?? '')
    validUrl = ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password
  } catch { /* Missing or invalid public URL. */ }

  if (!supabaseUrl || !validUrl || !supabasePublishableKey?.startsWith('sb_publishable_')
    || /YOUR_|REPLACE_/i.test(supabaseUrl + supabasePublishableKey)) {
    throw new ApiError('configuration', 'Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local, then restart Vite. Use a public publishable key.')
  }

  client ??= createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Password login only; signup/email callbacks and OAuth are outside this phase.
      detectSessionInUrl: false,
    },
  })
  return client
}
