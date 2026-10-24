import { env } from '../../config/env'
import { reportResponseSchema, type ReportReceipt, type ReportSubmission } from '../contracts/incident'
import { getSupabaseAccessToken } from '../auth/supabaseSession'
import { ApiError } from './ApiError'
import { reportRequestPath, toReportRequest } from './reportRequest'

function reportEndpoint(): string {
  try {
    const url = new URL(env.apiBaseUrl)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error()
    return `${url.href.replace(/\/+$/, '')}${reportRequestPath}`
  } catch {
    throw new ApiError('configuration', 'Set VITE_API_BASE_URL to the backend base URL, then restart Vite.')
  }
}

function responseError(status: number): ApiError {
  if (status === 401) return new ApiError('unauthorized', 'Your session was rejected. Log in again; your draft is preserved.')
  if (status === 403) return new ApiError('forbidden', 'This account is not allowed to submit the report.')
  if (status === 422 || status === 400) return new ApiError('validation', 'The report fields were rejected. Review your answers.')
  if (status === 429) return new ApiError('rate-limit', 'Too many report submissions. Wait before trying again.')
  return new ApiError('unknown', 'Report creation could not be confirmed. Your draft is preserved.')
}

export async function submitReport(submission: ReportSubmission): Promise<ReportReceipt> {
  const endpoint = reportEndpoint()
  let body: string
  try {
    body = JSON.stringify(toReportRequest(submission))
  } catch {
    throw new ApiError('validation', 'Check the report description and optional fields before submitting.')
  }
  const token = await getSupabaseAccessToken()
  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body,
      credentials: 'omit',
      redirect: 'error',
    })
  } catch {
    // Do not echo request/server details: they can contain report text or credentials.
    throw new ApiError('network', 'Unable to confirm report creation. Check your connection; your draft is preserved.')
  }
  if (response.status !== 201) throw responseError(response.status)

  try {
    const parsed = reportResponseSchema.safeParse(await response.json())
    if (!parsed.success) throw new Error()
    // The existing receipt holds the persisted UUID, without requiring AI output.
    return { report: parsed.data }
  } catch {
    // HTTP 201 already confirmed persistence. Prevent an accidental duplicate retry.
    throw new ApiError('confirmation', 'The backend confirmed creation, but the saved report details could not be read. Do not resubmit.')
  }
}
