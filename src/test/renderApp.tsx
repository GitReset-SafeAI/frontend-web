import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'

import { AppRoutes } from '../app/AppRoutes'
import { AuthProvider } from '../features/account'
import { ReportDraftProvider } from '../features/reporting'
import i18n from '../i18n'

export function renderApp(initialPath = '/') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialPath]}>
          <AuthProvider>
            <ReportDraftProvider>
              <AppRoutes />
            </ReportDraftProvider>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}
