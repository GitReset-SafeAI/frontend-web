import { z } from 'zod'

import { DEMO_CONTACTS, DEMO_EMAIL, DEMO_NAME } from '../../config/demo'
import { ApiError } from '../api/ApiError'
import { type AuthService, type ContactService, type User } from '../contracts'
import { emergencyContactSchema, MAX_CONTACTS, userSchema } from '../contracts/account'
import { newId, readJson, removeKey, writeJson } from './demoStore'

const accountsKey = 'safestep.demo.accounts'
const sessionKey = 'safestep.demo.session'
const contactsKey = (userId: string) => `safestep.demo.contacts.${userId}`

const accountsSchema = z.array(userSchema)
const sessionSchema = z.object({ userId: z.string() })
const contactsSchema = z.array(emergencyContactSchema)

// A touch of latency so loading states are visible in demos. Tests skip it.
const latencyMs = import.meta.env.MODE === 'test' ? 0 : 400
const wait = () => new Promise<void>((resolve) => { setTimeout(resolve, latencyMs) })

const accounts = (): User[] => {
  const parsed = accountsSchema.safeParse(readJson(accountsKey))
  return parsed.success ? parsed.data : []
}

const currentUser = (): User | null => {
  const session = sessionSchema.safeParse(readJson(sessionKey))
  if (!session.success) return null
  return accounts().find((account) => account.id === session.data.userId) ?? null
}

const requireUser = (): User => {
  const user = currentUser()
  if (!user) throw new ApiError('unauthorized', 'You need to be logged in.')
  return user
}

const readContacts = (userId: string) => {
  const parsed = contactsSchema.safeParse(readJson(contactsKey(userId)))
  return parsed.success ? parsed.data : []
}

function createDemoAccount(): User {
  const user: User = { id: newId(), name: DEMO_NAME, email: DEMO_EMAIL }
  writeJson(accountsKey, [...accounts(), user])
  writeJson(contactsKey(user.id), DEMO_CONTACTS.map((contact) => ({ ...contact, id: newId() })))
  return user
}

// Demo sign-in: no password is read, checked, or stored. It exists to exercise the screens and the service
// boundary, and must never be mistaken for real authentication.
export const mockAuth: AuthService = {
  async getSession() {
    await wait()
    return currentUser()
  },
  async signUp({ name, email }) {
    await wait()
    const normalised = email.trim().toLowerCase()
    if (accounts().some((account) => account.email === normalised)) {
      throw new ApiError('conflict', 'An account with this email already exists.')
    }
    const user: User = { id: newId(), name: name.trim(), email: normalised }
    writeJson(accountsKey, [...accounts(), user])
    writeJson(sessionKey, { userId: user.id })
    return user
  },
  async logIn({ email }) {
    await wait()
    const normalised = email.trim().toLowerCase()
    // The demo account is created the first time anyone logs in with its email.
    const user = accounts().find((account) => account.email === normalised) ?? (normalised === DEMO_EMAIL ? createDemoAccount() : undefined)
    if (!user) throw new ApiError('not-found', 'No account with this email.')
    writeJson(sessionKey, { userId: user.id })
    return user
  },
  async logOut() {
    await wait()
    removeKey(sessionKey)
  },
}

export const mockContacts: ContactService = {
  async list() {
    await wait()
    return readContacts(requireUser().id)
  },
  async add(input) {
    await wait()
    const user = requireUser()
    const contacts = readContacts(user.id)
    if (contacts.length >= MAX_CONTACTS) throw new ApiError('limit', `At most ${MAX_CONTACTS} contacts.`)
    const contact = { ...input, id: newId() }
    writeJson(contactsKey(user.id), [...contacts, contact])
    return contact
  },
  async update(id, input) {
    await wait()
    const user = requireUser()
    const contacts = readContacts(user.id)
    if (!contacts.some((contact) => contact.id === id)) throw new ApiError('not-found', 'No such contact.')
    const updated = { ...input, id }
    writeJson(contactsKey(user.id), contacts.map((contact) => (contact.id === id ? updated : contact)))
    return updated
  },
  async remove(id) {
    await wait()
    const user = requireUser()
    writeJson(contactsKey(user.id), readContacts(user.id).filter((contact) => contact.id !== id))
  },
  async makePrimary(id) {
    await wait()
    const user = requireUser()
    const contacts = readContacts(user.id)
    const chosen = contacts.find((contact) => contact.id === id)
    if (!chosen) throw new ApiError('not-found', 'No such contact.')
    writeJson(contactsKey(user.id), [chosen, ...contacts.filter((contact) => contact.id !== id)])
  },
}
