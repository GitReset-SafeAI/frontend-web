import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'

import i18n from '../i18n'

// jsdom has no <dialog> modal support or scrolling, so provide the minimum the app relies on.
HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) { this.setAttribute('open', '') }
HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
  this.removeAttribute('open')
  this.dispatchEvent(new Event('close'))
}
window.scrollTo = () => undefined

beforeEach(async () => { await i18n.changeLanguage('en') })
afterEach(() => { cleanup() })
