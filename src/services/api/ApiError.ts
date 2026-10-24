export type ApiErrorKind =
  // transport and protocol
  | 'network'
  | 'timeout'
  | 'cancelled'
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'conflict'
  | 'limit'
  | 'server'
  | 'http'
  | 'invalid-response'
  // application
  | 'configuration'
  | 'not-implemented'
  | 'invalid-credentials'
  | 'email-unconfirmed'
  | 'rate-limit'
  | 'unknown'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number

  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
  }
}

export function httpError(status: number): ApiError {
  const kind: ApiErrorKind = status === 401 ? 'unauthorized'
    : status === 403 ? 'forbidden'
      : status === 404 ? 'not-found'
        : status === 400 || status === 422 ? 'validation'
          : status >= 500 ? 'server' : 'http'
  // Do not expose private response bodies or URLs in UI errors.
  return new ApiError(kind, 'The request could not be completed.', status)
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (error instanceof Error && error.name === 'AbortError') {
    return new ApiError('cancelled', 'The request was cancelled.')
  }
  return new ApiError('network', 'Unable to connect. Please try again.')
}
