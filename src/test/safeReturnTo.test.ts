import { describe, expect, it } from 'vitest'

import { safeReturnTo } from '../features/account/safeReturnTo'

describe('login return destinations', () => {
  it.each([undefined, null, 123, '', 'https://other.example', '//other.example', '/\\other.example', '/login', '/login?mode=signup', '/report/../login', '/\n/other.example', ' /account', '/l%6fgin', '/login%2f', '/%5cother.example', '/%2fother.example'])('rejects unsafe or looping destination %j', (value) => {
    expect(safeReturnTo(value)).toBeUndefined()
  })

  it.each(['/', '/account', '/safety?area=colombo#summary', '/report/details'])('preserves local destination %s', (value) => {
    expect(safeReturnTo(value)).toBe(value)
  })
})
