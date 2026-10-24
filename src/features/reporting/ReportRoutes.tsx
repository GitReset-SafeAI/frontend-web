import { Route, Routes } from 'react-router-dom'

import { ReportDescribeScreen } from './screens/ReportDescribeScreen'
import { ReportDetailsScreen } from './screens/ReportDetailsScreen'
import { ReportReviewScreen } from './screens/ReportReviewScreen'
import { ReportSubmittedScreen } from './screens/ReportSubmittedScreen'
import { ReportWhenScreen } from './screens/ReportWhenScreen'

// Mounted at /report/*. Routes carry no report content or location; the draft lives in memory above.
export function ReportRoutes() {
  return (
    <Routes>
      <Route index element={<ReportDescribeScreen />} />
      <Route path="when" element={<ReportWhenScreen />} />
      <Route path="details" element={<ReportDetailsScreen />} />
      <Route path="review" element={<ReportReviewScreen />} />
      <Route path="submitted" element={<ReportSubmittedScreen />} />
    </Routes>
  )
}
