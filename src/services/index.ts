import { env, type AppEnvironment } from '../config/env'
import { apiServices } from './api'
import type { AppServices } from './contracts'
import { mockServices } from './mocks'
import { supabaseAuth } from './auth/supabaseAuth'

export function selectServices(mode: AppEnvironment['dataMode'], authMode: AppEnvironment['authMode'] = env.authMode): AppServices {
  const data = mode === 'mock' ? mockServices : apiServices
  return {
    ...data,
    auth: authMode === 'demo' ? mockServices.auth : supabaseAuth,
    // Real-account creation is independent of unrelated mock-backed data features.
    reports: {
      ...data.reports,
      submitReport: authMode === 'supabase' ? apiServices.reports.submitReport : data.reports.submitReport,
      transcribeVoice: authMode === 'supabase' ? apiServices.reports.transcribeVoice : data.reports.transcribeVoice,
    },
    // Real users must never read or write contacts under an old demo session.
    // These fail explicitly until contact persistence/authorization is implemented.
    contacts: authMode === 'demo' ? data.contacts : apiServices.contacts,
  }
}

export const services = selectServices(env.dataMode, env.authMode)
export const contactsAvailable = env.authMode === 'demo' && env.dataMode === 'mock'
