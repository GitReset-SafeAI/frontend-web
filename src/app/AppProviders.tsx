import { QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { I18nextProvider } from 'react-i18next'
import { BrowserRouter } from 'react-router-dom'

import { AuthProvider } from '../features/account'
import { ReportDraftProvider } from '../features/reporting'
import i18n from '../i18n'
import { queryClient } from '../services/queryClient'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            {/* Above the routes so a draft survives moving between pages, and is gone on refresh. */}
            <ReportDraftProvider>{children}</ReportDraftProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </I18nextProvider>
  )
}
