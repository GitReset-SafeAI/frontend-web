import { z } from 'zod'

const configSchema = z.object({
  dataMode: z.enum(['mock', 'api']).default('mock'),
})

export type AppEnvironment = z.infer<typeof configSchema>

// Only explicitly public, VITE_-prefixed values are read. Never put secrets here: they ship to the browser.
export function parseEnvironment(values: { dataMode?: string }): AppEnvironment {
  return configSchema.parse({ dataMode: values.dataMode || undefined })
}

export const env = parseEnvironment({ dataMode: import.meta.env.VITE_DATA_MODE })
