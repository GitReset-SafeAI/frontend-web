import { env } from '../../config/env'

export const SOS_SMS_TEXT = 'SOS: I may be in danger. Please contact me immediately. My latest shared location: '

export function trackingUrl(shareId: string): string {
  return new URL('/track/' + encodeURIComponent(shareId), env.publicAppUrl || window.location.origin).href
}

export function smsUri(phone: string, message: string, apple = /iPhone|iPad|iPod/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)): string {
  if (!/^\+[1-9][0-9]{7,14}$/.test(phone)) throw new Error('A valid contact phone number is required.')
  return 'sms:' + phone + (apple ? '&' : '?') + 'body=' + encodeURIComponent(message)
}

export function openSmsDraft(phone: string, message: string): void {
  window.location.href = smsUri(phone, message)
}
