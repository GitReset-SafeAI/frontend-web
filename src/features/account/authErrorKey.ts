import { ApiError } from '../../services/api/ApiError'

export function authErrorKey(error: unknown): string {
  const kind = error instanceof ApiError ? error.kind : 'unknown'
  const keys: Partial<Record<ApiError['kind'], string>> = {
    configuration: 'configuration',
    'invalid-credentials': 'invalidCredentials',
    unauthorized: 'invalidCredentials',
    'email-unconfirmed': 'emailUnconfirmed',
    'rate-limit': 'rateLimit',
    network: 'network',
    'not-found': 'notFound',
    conflict: 'conflict',
  }
  return `auth.errors.${keys[kind] ?? 'generic'}`
}
