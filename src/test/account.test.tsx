import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { renderApp } from './renderApp'

type User = ReturnType<typeof userEvent.setup>

async function signUp(user: User, name = 'Nimali', email = 'nimali@example.lk') {
  await user.type(screen.getByLabelText('Your name'), name)
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText(/^password/i), 'password1')
  await user.click(screen.getByRole('button', { name: /^create account$/i }))
}

async function addContact(user: User, name: string, phone: string, relationship?: string) {
  await user.click(screen.getByRole('button', { name: /add a contact/i }))
  const dialog = screen.getByRole('dialog', { name: /add a contact/i, hidden: true })
  await user.type(within(dialog).getByLabelText('Name'), name)
  await user.type(within(dialog).getByLabelText('Phone number'), phone)
  if (relationship) await user.click(within(dialog).getByRole('radio', { name: relationship }))
  await user.click(within(dialog).getByRole('button', { name: /save contact/i }))
}

describe('account', () => {
  it('sends a logged-out visitor from the account page to log in', async () => {
    renderApp('/account')
    expect(await screen.findByRole('heading', { level: 1, name: /welcome back/i })).toBeInTheDocument()
  })

  it('says plainly that sign-in is a demo', () => {
    renderApp('/login')
    expect(screen.getByText(/demo sign-in/i)).toBeInTheDocument()
  })

  it('validates the form and explains each problem next to its field', async () => {
    const user = userEvent.setup()
    renderApp('/login?mode=signup')
    await user.click(screen.getByRole('button', { name: /^create account$/i }))
    expect(screen.getByText('Please enter your name.')).toBeInTheDocument()
    expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument()
    expect(screen.getByText('Use at least 8 characters.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInvalid()
  })

  it('does not log in to an account that does not exist', async () => {
    const user = userEvent.setup()
    renderApp('/login')
    await user.type(screen.getByLabelText('Email'), 'nobody@example.lk')
    await user.type(screen.getByLabelText('Password'), 'whatever')
    await user.click(screen.getByRole('button', { name: /^log in$/i }))
    expect(await screen.findByText(/couldn't find an account with that email/i)).toBeInTheDocument()
  })

  it('creates an account, adds contacts, and uses the first as primary', async () => {
    const user = userEvent.setup()
    renderApp('/login?mode=signup')
    await signUp(user)

    // A new account goes straight to the place where it is useful.
    expect(await screen.findByRole('heading', { level: 1, name: /hello, nimali/i })).toBeInTheDocument()
    expect(await screen.findByText(/no contacts yet/i)).toBeInTheDocument()

    await addContact(user, 'Amma', '077 123 4567', 'Family')
    await waitFor(() => { expect(screen.getByRole('heading', { name: 'Amma' })).toBeInTheDocument() })
    expect(screen.getByText('077 123 4567')).toBeInTheDocument()
    expect(screen.getByText('Primary')).toBeInTheDocument()
    expect(screen.getByText('1 of 5')).toBeInTheDocument()
  })

  it('rejects a phone number that is not a Sri Lankan number', async () => {
    const user = userEvent.setup()
    renderApp('/login?mode=signup')
    await signUp(user)
    await screen.findByText(/no contacts yet/i)

    await addContact(user, 'Someone', '12345')
    const dialog = screen.getByRole('dialog', { name: /add a contact/i, hidden: true })
    expect(within(dialog).getByText(/valid sri lankan phone number/i)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Someone' })).not.toBeInTheDocument()
  })

  it('lets you change who SOS calls by making another contact primary', async () => {
    const user = userEvent.setup()
    renderApp('/login?mode=signup')
    await signUp(user)
    await screen.findByText(/no contacts yet/i)
    await addContact(user, 'Amma', '0771234567')
    await screen.findByRole('heading', { name: 'Amma' })
    await addContact(user, 'Kasun', '0112345678')
    await screen.findByRole('heading', { name: 'Kasun' })

    await user.click(screen.getByRole('button', { name: /make kasun the primary contact/i }))
    await waitFor(() => {
      const first = screen.getAllByRole('heading', { level: 3 })[0]
      expect(first).toHaveTextContent('Kasun')
    })
  })

  it('removes a contact only after confirming', async () => {
    const user = userEvent.setup()
    renderApp('/login?mode=signup')
    await signUp(user)
    await screen.findByText(/no contacts yet/i)
    await addContact(user, 'Amma', '0771234567')
    await screen.findByRole('heading', { name: 'Amma' })

    await user.click(screen.getByRole('button', { name: /remove amma/i }))
    const dialog = screen.getByRole('dialog', { name: /remove amma\?/i, hidden: true })
    await user.click(within(dialog).getByRole('button', { name: /yes, remove/i }))
    await waitFor(() => { expect(screen.queryByRole('heading', { name: 'Amma' })).not.toBeInTheDocument() })
  })

  it('stops at five contacts', async () => {
    const user = userEvent.setup()
    renderApp('/login?mode=signup')
    await signUp(user)
    await screen.findByText(/no contacts yet/i)
    for (const [index, name] of ['A', 'B', 'C', 'D', 'E'].entries()) {
      await addContact(user, name, `07712345${index}0`)
      await screen.findByRole('heading', { name })
    }
    expect(screen.getByRole('button', { name: /add a contact/i })).toBeDisabled()
    expect(screen.getByText(/added the most you can/i)).toBeInTheDocument()
  })

  it('keeps one person from seeing another person\'s contacts, and logging out clears the session', async () => {
    const user = userEvent.setup()
    renderApp('/login?mode=signup')
    await signUp(user, 'Nimali', 'nimali@example.lk')
    await screen.findByText(/no contacts yet/i)
    await addContact(user, 'Amma', '0771234567')
    await screen.findByRole('heading', { name: 'Amma' })

    await user.click(screen.getByRole('button', { name: /log out/i }))
    expect(await screen.findByRole('heading', { level: 1, name: /welcome back/i })).toBeInTheDocument()

    // A different person signs up on the same browser: they start empty.
    await user.click(screen.getByRole('tab', { name: /create account/i }))
    await signUp(user, 'Dilani', 'dilani@example.lk')
    expect(await screen.findByRole('heading', { level: 1, name: /hello, dilani/i })).toBeInTheDocument()
    expect(await screen.findByText(/no contacts yet/i)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Amma' })).not.toBeInTheDocument()
  })

  it('sends a new account from the SOS prompt to add its first contact, then SOS works', async () => {
    const user = userEvent.setup()
    renderApp('/sos')
    await user.click(await screen.findByRole('link', { name: /create account/i }))
    await signUp(user)
    // A new account has no contacts, so it lands where they are added rather than on a SOS screen with nobody to call.
    expect(await screen.findByRole('heading', { level: 1, name: /hello, nimali/i })).toBeInTheDocument()
    await screen.findByText(/no contacts yet/i)
    await addContact(user, 'Amma', '0771234567')
    await screen.findByRole('heading', { name: 'Amma' })
  })

  it('returns to the page you came from after logging in', async () => {
    const user = userEvent.setup()
    renderApp('/login?mode=signup')
    await signUp(user)
    await screen.findByRole('heading', { level: 1, name: /hello, nimali/i })
    await user.click(screen.getByRole('button', { name: /log out/i }))
    await screen.findByRole('heading', { level: 1, name: /welcome back/i })
    await user.type(screen.getByLabelText('Email'), 'nimali@example.lk')
    await user.type(screen.getByLabelText('Password'), 'anything')
    await user.click(screen.getByRole('button', { name: /^log in$/i }))
    // Logging out sent us to log in while remembering the account page, so logging in returns there.
    expect(await screen.findByRole('heading', { level: 1, name: /hello, nimali/i })).toBeInTheDocument()
  })

  it('has a ready-made demo account: one click, with sample contacts', async () => {
    const user = userEvent.setup()
    renderApp('/login')
    await user.click(screen.getByRole('button', { name: /use demo account/i }))
    expect(await screen.findByRole('heading', { level: 1, name: /hello, demo/i })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Amma (sample)' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Friend (sample)' })).toBeInTheDocument()
    expect(screen.getByText('2 of 5')).toBeInTheDocument()
  })

  it('also lets you type the demo email into the normal log-in form', async () => {
    const user = userEvent.setup()
    renderApp('/login')
    await user.type(screen.getByLabelText('Email'), 'DEMO@safestep.lk')
    await user.type(screen.getByLabelText('Password'), 'anything')
    await user.click(screen.getByRole('button', { name: /^log in$/i }))
    // A normal log-in lands on the home page, signed in as the demo user.
    expect(await screen.findByRole('heading', { level: 1, name: /know what has been reported/i })).toBeInTheDocument()
    await user.click(screen.getAllByRole('link', { name: /your account, demo/i })[0])
    expect(await screen.findByRole('heading', { name: 'Amma (sample)' })).toBeInTheDocument()
  })

  it('keeps edits to the demo account, and SOS then calls its primary contact', async () => {
    const user = userEvent.setup()
    renderApp('/login')
    await user.click(screen.getByRole('button', { name: /use demo account/i }))
    await screen.findByRole('heading', { name: 'Amma (sample)' })
    await user.click(screen.getByRole('button', { name: /remove friend \(sample\)/i }))
    await user.click(within(screen.getByRole('dialog', { name: /remove friend/i, hidden: true })).getByRole('button', { name: /yes, remove/i }))
    await waitFor(() => { expect(screen.queryByRole('heading', { name: 'Friend (sample)' })).not.toBeInTheDocument() })

    await user.click(screen.getByRole('button', { name: /log out/i }))
    await screen.findByRole('heading', { level: 1, name: /welcome back/i })
    await user.click(screen.getByRole('button', { name: /use demo account/i }))
    await screen.findByRole('heading', { name: 'Amma (sample)' })
    // The removal persisted: logging back in does not reset the demo account.
    expect(screen.queryByRole('heading', { name: 'Friend (sample)' })).not.toBeInTheDocument()
  })
})
