import { z } from 'zod'

const configSchema = z.object({
  dataMode: z.enum(['mock', 'api']).default('mock'),
  authMode: z.enum(['demo', 'supabase']).default('demo'),
  supabaseUrl: z.string().trim().optional(),
  supabasePublishableKey: z.string().trim().optional(),
  // Same guard as the mobile client: an HTTP(S) origin with no credentials,
  // query or fragment, so a base URL cannot smuggle anything into a request.
  apiBaseUrl: z.string().url().refine((value) => {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash
  }, 'Use an HTTP(S) base URL without credentials, query, or fragment').optional(),
})

export type AppEnvironment = z.infer<typeof configSchema>

// Only explicitly public, VITE_-prefixed values are read. Never put secrets here: they ship to the browser.
export function parseEnvironment(values: {
  dataMode?: string
  authMode?: string
  supabaseUrl?: string
  supabasePublishableKey?: string
  apiBaseUrl?: string
}): AppEnvironment {
  const result = configSchema.safeParse({
    ...values,
    dataMode: values.dataMode?.trim() || undefined,
    authMode: values.authMode?.trim() || undefined,
    apiBaseUrl: values.apiBaseUrl?.trim() || undefined,
  })
  if (!result.success) {
    // Avoid including environment values in diagnostics.
    throw new Error('Invalid public app configuration. Check the VITE_ values in .env.example.')
  }
  return result.data
}

export const env = parseEnvironment({
  dataMode: import.meta.env.VITE_DATA_MODE,
  authMode: import.meta.env.VITE_AUTH_MODE,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
})
