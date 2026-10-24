import { type PropsWithChildren, useCallback, useMemo, useState } from 'react'

import type { ReportReceipt } from '../../services/contracts'
import { emptyDraft, ReportDraftContext, type ReportDraft } from './reportDraftContext'

// In-memory only. Nothing about a draft is persisted, logged, or placed in the URL.
export function ReportDraftProvider({ children }: PropsWithChildren) {
  const [draft, setDraft] = useState<ReportDraft>(emptyDraft)
  const [receipt, setReceipt] = useState<ReportReceipt | undefined>()
  const update = useCallback((patch: Partial<ReportDraft>) => { setDraft((current) => ({ ...current, ...patch })) }, [])
  const reset = useCallback(() => { setDraft(emptyDraft); setReceipt(undefined) }, [])
  const value = useMemo(() => ({ draft, update, receipt, setReceipt, reset }), [draft, update, receipt, reset])
  return <ReportDraftContext.Provider value={value}>{children}</ReportDraftContext.Provider>
}
