// Only app-local destinations are accepted. Never redirect back into login itself.
export function safeReturnTo(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\s]/.test(value)
    || [...value].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) return undefined
  try {
    const base = 'https://app.invalid'
    const url = new URL(value, base)
    const pathname = decodeURIComponent(url.pathname)
    if (url.origin !== base || pathname.startsWith('//') || /[\\\s]/.test(pathname)
      || /^\/login\/?$/i.test(pathname)
      || [...pathname].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) return undefined
    return `${url.pathname}${url.search}${url.hash}`
  } catch { return undefined }
}
