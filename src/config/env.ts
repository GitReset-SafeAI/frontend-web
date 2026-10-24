import { z } from 'zod'

const configSchema = z.object({
  dataMode: z.enum(['mock', 'api']).default('mock'),
  authMode: z.enum(['demo', 'supabase']).default('demo'),
  supabaseUrl: z.string().trim().optional(),
  supabasePublishableKey: z.string().trim().optional(),
})

export type AppEnvironment = z.infer<typeof configSchema>

// Only explicitly public, VITE_-prefixed values are read. Never put secrets here: they ship to the browser.
export function parseEnvironment(values: {
  dataMode?: string
  authMode?: string
  supabaseUrl?: string
  supabasePublishableKey?: string
}): AppEnvironment {
  return configSchema.parse({ ...values, dataMode: values.dataMode || undefined, authMode: values.authMode || undefined })
}

export const env = parseEnvironment({
  dataMode: import.meta.env.VITE_DATA_MODE,
  authMode: import.meta.env.VITE_AUTH_MODE,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
})
