export type ApiErrorKind = 'not-implemented' | 'network' | 'unauthorized' | 'not-found' | 'conflict' | 'limit' | 'unknown'

export class ApiError extends Error {
  readonly kind: ApiErrorKind

  constructor(kind: ApiErrorKind, message: string) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
  }
}
