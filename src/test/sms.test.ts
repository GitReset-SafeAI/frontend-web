import { describe, expect, it, vi } from 'vitest'
vi.mock('../config/env', () => ({ env: { publicAppUrl: 'https://safety.example' } }))
import { smsUri, trackingUrl, SOS_SMS_TEXT } from '../features/emergency/sms'

describe('SMS draft links', () => {
  it.each([true, false])('encodes the message and tracking URL once (Apple: %s)', (apple) => {
    const link = trackingUrl('share-token')
    const message = SOS_SMS_TEXT + link + '?test=a&b=1'
    const uri = smsUri('+94771234567', message, apple)
    expect(uri.startsWith('sms:+94771234567' + (apple ? '&' : '?') + 'body=')).toBe(true)
    expect(decodeURIComponent(uri.split('body=')[1])).toBe(message)
    expect(link).toBe('https://safety.example/track/share-token')
  })
  it('rejects phone values that could inject another URI', () => {
    expect(() => smsUri('+9477?body=bad', 'SOS')).toThrow()
  })
})
