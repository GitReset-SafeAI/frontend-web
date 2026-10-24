import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { DEMO_EMAIL } from '../config/demo'
import { mockServices } from '../services/mocks'
import type { ContactInput } from '../services/contracts'
import { renderApp } from './renderApp'

// Starts a test already signed in, with the given contacts, by using the same service the app does.
async function seedAccount(contacts: ContactInput[]) {
  await mockServices.auth.signUp({ name: 'Nimali', email: 'nimali@example.lk', password: 'password1' })
  for (const contact of contacts) await mockServices.contacts.add(contact)
}

describe('landing and navigation', () => {
  it('shows the landing page with honest limits and links into the product', () => {
    renderApp('/')
    expect(screen.getByRole('heading', { level: 1, name: /know what has been reported/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /few reports is not safe/i })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /report an incident/i }).length).toBeGreaterThan(0)
  })

  it('keeps SOS one tap away and switches the interface language to Sinhala and Tamil', async () => {
    const user = userEvent.setup()
    renderApp('/report')
    expect(screen.getByRole('link', { name: /sos emergency help/i })).toHaveAttribute('href', '/sos')

    const select = screen.getByRole('combobox', { name: /interface language/i })
    expect(within(select).getAllByRole('option').map((option) => option.textContent)).toEqual(['English', 'සිංහල', 'தமிழ்'])

    await user.selectOptions(select, 'si')
    expect(document.documentElement.lang).toBe('si')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('සිදු වුණේ')

    await user.selectOptions(screen.getByRole('combobox'), 'ta')
    expect(document.documentElement.lang).toBe('ta')
    expect(screen.getByRole('heading', { level: 1, name: 'என்ன நடந்தது?' })).toBeInTheDocument()
  })

  it('renders Tamil on every page without leaking untranslated keys', async () => {
    const { default: i18n } = await import('../i18n')
    await i18n.changeLanguage('ta')
    for (const path of ['/', '/report', '/report/when', '/report/details', '/emergency', '/sos', '/login', '/login?mode=signup']) {
      const { container, unmount } = renderApp(path)
      // A missing key renders as its dotted path (e.g. "describe.title"); none should appear.
      // (The demo account's email address is real text, not a key.)
      expect((container.textContent ?? '').replace(DEMO_EMAIL, '')).not.toMatch(/\b[a-z][A-Za-z]+\.[a-z][A-Za-z.]+\b/)
      unmount()
    }
    renderApp('/safety')
    await waitFor(() => { expect(screen.getByRole('heading', { name: 'Colombo Fort & Pettah' })).toBeInTheDocument() })
    expect(screen.getAllByText('போதிய தரவு இல்லை').length).toBeGreaterThan(0)
  })

  it('shows a not-found page for unknown routes', () => {
    renderApp('/nope')
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument()
  })
})

describe('report flow', () => {
  it('blocks a too-short description and then completes the whole flow with optional steps skipped', async () => {
    const user = userEvent.setup()
    renderApp('/report')

    await user.click(screen.getByRole('button', { name: /^next$/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/at least 10 characters/i)

    await user.type(screen.getByRole('textbox', { name: /describe the incident/i }), 'A man followed me near the bus stand.')
    await user.click(screen.getByRole('button', { name: /^next$/i }))

    // When & where is optional: the button reads Skip until something is answered.
    expect(screen.getByRole('heading', { level: 1, name: /when and where/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^skip$/i }))
    expect(screen.getByRole('heading', { level: 1, name: /anything else/i })).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: /dim/i }))
    expect(screen.getByRole('radio', { name: /dim/i })).toBeChecked()
    await user.click(screen.getByRole('button', { name: /^next$/i }))

    expect(screen.getByRole('heading', { level: 1, name: /review and submit/i })).toBeInTheDocument()
    expect(screen.getByText(/lighting: dim/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /submit report/i }))

    await waitFor(() => { expect(screen.getByRole('heading', { level: 1, name: /report received/i })).toBeInTheDocument() })
    // The user's words and the AI's estimate stay separate, and the estimate is labelled as such.
    expect(screen.getByText('Your words')).toBeInTheDocument()
    expect(screen.getByText(/automated estimate, not a verified fact/i)).toBeInTheDocument()
    expect(screen.getByText('Being followed')).toBeInTheDocument()
  })

  it('lets an optional answer be cleared by choosing it again', async () => {
    const user = userEvent.setup()
    renderApp('/report/details')
    const dim = screen.getByRole('radio', { name: /dim/i })
    await user.click(dim)
    await user.click(dim)
    expect(dim).not.toBeChecked()
  })

  it('requires a voice transcript to be confirmed before continuing', async () => {
    const user = userEvent.setup()
    renderApp('/report')
    await user.click(screen.getByRole('button', { name: /speak instead/i }))
    const dialog = screen.getByRole('dialog', { hidden: true })
    await user.click(within(dialog).getByRole('button', { name: /^start$/i }))
    await user.click(within(dialog).getByRole('button', { name: /stop and transcribe/i }))

    await waitFor(() => { expect(screen.getByRole('button', { name: /transcript looks right/i })).toBeInTheDocument() })
    await user.click(screen.getByRole('button', { name: /^next$/i }))
    expect(screen.getByText(/please confirm the transcript/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /transcript looks right/i }))
    await user.click(screen.getByRole('button', { name: /^next$/i }))
    expect(screen.getByRole('heading', { level: 1, name: /when and where/i })).toBeInTheDocument()
  })

  it('stores a district choice as an approximate location', async () => {
    const user = userEvent.setup()
    renderApp('/report/when')
    await user.click(screen.getByRole('button', { name: /choose a district/i }))
    await user.click(within(screen.getByRole('dialog', { hidden: true })).getByRole('button', { name: 'Kandy' }))
    expect(screen.getByText(/kandy district/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^next$/i })).toBeInTheDocument()
  })
})

describe('emergency', () => {
  it('counts down toward the primary contact and can be cancelled without calling', async () => {
    const user = userEvent.setup()
    await seedAccount([{ name: 'Amma', phone: '+94771234567', relationship: 'family' }])
    renderApp('/sos')
    expect(await screen.findByRole('heading', { name: /calling amma in/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /call now/i })).toBeInTheDocument()
    expect(screen.getByText(/does not alert anyone for you/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^cancel$/i }))
    expect(screen.queryByText(/call started/i)).not.toBeInTheDocument()
  })

  it('opens the SOS countdown from the emergency page button', async () => {
    const user = userEvent.setup()
    await seedAccount([{ name: 'Amma', phone: '+94771234567' }])
    renderApp('/emergency')
    await user.click(screen.getByRole('button', { name: /sos\. emergency help/i }))
    expect(await screen.findByRole('heading', { name: /calling amma/i })).toBeInTheDocument()
  })

  it('lists contacts on the emergency page as tap-to-call links', async () => {
    await seedAccount([
      { name: 'Amma', phone: '+94771234567' },
      { name: 'Kasun', phone: '+94112345678' },
    ])
    renderApp('/emergency')
    expect(await screen.findByRole('link', { name: /call amma/i })).toHaveAttribute('href', 'tel:+94771234567')
    expect(screen.getByRole('link', { name: /call kasun/i })).toHaveAttribute('href', 'tel:+94112345678')
    expect(screen.getByText('077 123 4567')).toBeInTheDocument()
  })

  it('never calls anyone when logged out: it asks you to log in instead', async () => {
    renderApp('/sos')
    expect(await screen.findByRole('heading', { name: /add an emergency contact first/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^log in$/i })).toHaveAttribute('href', '/login')
    expect(screen.queryByRole('button', { name: /call now/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
  })

  it('asks a logged-in user with no contacts to add one', async () => {
    await seedAccount([])
    renderApp('/sos')
    expect(await screen.findByRole('heading', { name: /add an emergency contact first/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /add a contact/i })).toHaveAttribute('href', '/account')
  })

  it('no longer mentions police or ambulance numbers anywhere', async () => {
    await seedAccount([{ name: 'Amma', phone: '+94771234567' }])
    for (const path of ['/', '/emergency', '/sos', '/safety', '/account', '/login']) {
      const { container, unmount } = renderApp(path)
      await waitFor(() => { expect(container.textContent).not.toBe('') })
      expect(container.textContent).not.toMatch(/\b119\b|\b1990\b|police|ambulance/i)
      unmount()
    }
  })
})

describe('safety map', () => {
  it('lists aggregated areas with caveats and leaves a slot for the map', async () => {
    const user = userEvent.setup()
    renderApp('/safety')
    await waitFor(() => { expect(screen.getByRole('heading', { name: 'Colombo Fort & Pettah' })).toBeInTheDocument() })
    expect(screen.getByTestId('map-slot')).toBeInTheDocument()
    expect(screen.getAllByText(/does not mean (an area is )?safe|few reports does not mean/i).length).toBeGreaterThan(0)
    // Shown in the legend and on the low-data areas themselves.
    expect(screen.getAllByText('Not enough data').length).toBeGreaterThan(1)

    await user.click(screen.getAllByRole('button', { name: /show on map/i })[0])
    expect(screen.getByRole('button', { name: /close area details/i })).toBeInTheDocument()
  })
})
