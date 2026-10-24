import { z } from 'zod'

const configSchema = z.object({
  dataMode: z.enum(['mock', 'api']).default('mock'),
  authMode: z.enum(['demo', 'supabase']).default('demo'),
  apiBaseUrl: z.string().trim().default('http://127.0.0.1:8000'),
  supabaseUrl: z.string().trim().optional(),
  supabasePublishableKey: z.string().trim().optional(),
})

export type AppEnvironment = z.infer<typeof configSchema>

// Only explicitly public, VITE_-prefixed values are read. Never put secrets here: they ship to the browser.
export function parseEnvironment(values: {
  dataMode?: string
  authMode?: string
  apiBaseUrl?: string
  supabaseUrl?: string
  supabasePublishableKey?: string
}): AppEnvironment {
  return configSchema.parse({ ...values, dataMode: values.dataMode || undefined, authMode: values.authMode || undefined, apiBaseUrl: values.apiBaseUrl?.trim() || undefined })
}

export const env = parseEnvironment({
  dataMode: import.meta.env.VITE_DATA_MODE,
  authMode: import.meta.env.VITE_AUTH_MODE,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
})
