// Demo-only persistence so the sign-in and contacts flow survives a refresh. Everything here is synthetic:
// the demo account stores no password, and this module is only reachable in mock mode. Real data will live
// behind the API. Storage can be blocked (private windows), so reads and writes fall back to memory.
const memory = new Map<string, string>()

export function readJson(key: string): unknown {
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(key)
  } catch {
    raw = memory.get(key) ?? null
  }
  if (raw === null) return undefined
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

export function writeJson(key: string, value: unknown): void {
  const raw = JSON.stringify(value)
  memory.set(key, raw)
  try {
    window.localStorage.setItem(key, raw)
  } catch {
    // Memory copy is enough for this session.
  }
}

export function removeKey(key: string): void {
  memory.delete(key)
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Nothing to clean up.
  }
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
