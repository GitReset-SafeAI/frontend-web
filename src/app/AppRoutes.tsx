import { Route, Routes } from 'react-router-dom'

import { AccountPage, LoginPage } from '../features/account'
import { EmergencyPage, SosPage } from '../features/emergency'
import { LandingPage } from '../features/landing/LandingPage'
import { NotFoundPage } from '../features/landing/NotFoundPage'
import { ReportRoutes } from '../features/reporting'
import { SafetyPage } from '../features/safety'
import { AppShell } from '../shared/layouts/AppShell'
import { ScrollToTop } from './ScrollToTop'

export function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Full screen, no navigation chrome: nothing should compete with the countdown. */}
        <Route path="/sos" element={<SosPage />} />
        <Route element={<AppShell />}>
          <Route index element={<LandingPage />} />
          <Route path="/emergency" element={<EmergencyPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/report/*" element={<ReportRoutes />} />
          <Route path="/safety" element={<SafetyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  )
}
