import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { StrictMode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'

import { AppRoutes } from '../app/AppRoutes'
import { AuthProvider } from '../features/account'
import { ReportDraftProvider } from '../features/reporting'
import i18n from '../i18n'

export function renderApp(initialPath = '/', options: { strict?: boolean; state?: unknown } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const tree = (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[options.state ? { pathname: initialPath, state: options.state } : initialPath]}>
          <AuthProvider>
            <ReportDraftProvider>
              <AppRoutes />
            </ReportDraftProvider>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>
  )
  return { ...render(options.strict ? <StrictMode>{tree}</StrictMode> : tree), queryClient }
}
