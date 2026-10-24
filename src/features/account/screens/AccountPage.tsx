import { LogOut, Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'

import { ApiError } from '../../../services/api/ApiError'
import type { ContactInput, EmergencyContact } from '../../../services/contracts'
import { MAX_CONTACTS } from '../../../services/contracts/account'
import { Button } from '../../../shared/components/Button'
import { Dialog } from '../../../shared/components/Dialog'
import { InfoNote } from '../../../shared/components/InfoNote'
import { Spinner } from '../../../shared/components/Spinner'
import { useAuth } from '../authContext'
import { ContactCard } from '../components/ContactCard'
import { ContactFormDialog } from '../components/ContactFormDialog'
import { useContactMutations, useContacts } from '../hooks/useContacts'

// The first contact in the list is the one SOS calls. Contacts are shown, edited and removed here only.
export function AccountPage() {
  const { t } = useTranslation('account')
  const { user, status, logOut } = useAuth()
  const contacts = useContacts()
  const mutations = useContactMutations()
  const [editing, setEditing] = useState<EmergencyContact | 'new' | null>(null)
  const [removing, setRemoving] = useState<EmergencyContact | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  if (status === 'loading') return <Spinner label={t('account.loading')} />
  if (!user) return <Navigate to="/login" replace state={{ from: '/account' }} />

  const list = contacts.data ?? []
  const atLimit = list.length >= MAX_CONTACTS
  const saving = mutations.add.isPending || mutations.update.isPending

  const saveError = (() => {
    const error = mutations.add.error ?? mutations.update.error
    if (!error) return undefined
    return t(error instanceof ApiError && error.kind === 'limit' ? 'contacts.errors.limit' : 'contacts.errors.generic', { max: MAX_CONTACTS })
  })()

  const closeForm = () => {
    setEditing(null)
    mutations.add.reset()
    mutations.update.reset()
  }

  const save = (input: ContactInput) => {
    const done = { onSuccess: closeForm }
    if (editing && editing !== 'new') mutations.update.mutate({ id: editing.id, input }, done)
    else mutations.add.mutate(input, done)
  }

  const confirmRemove = () => {
    if (!removing) return
    mutations.remove.mutate(removing.id, { onSettled: () => { setRemoving(null) } })
  }

  const doLogOut = async () => {
    setLoggingOut(true)
    await logOut()
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="display-lg">{t('account.hello', { name: user.name })}</h1>
            <p className="m-0 break-all text-ink-muted">{user.email}</p>
          </div>
          <Button variant="secondary" loading={loggingOut} icon={<LogOut className="size-5" aria-hidden />} onClick={() => { void doLogOut() }}>
            {loggingOut ? t('account.loggingOut') : t('account.logout')}
          </Button>
        </header>

        <section aria-labelledby="contacts-heading" className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 id="contacts-heading" className="text-3xl">{t('contacts.title')}</h2>
              <p className="m-0 max-w-xl text-lg text-ink-muted">{t('contacts.subtitle', { max: MAX_CONTACTS })}</p>
            </div>
            <p className="m-0 rounded-full bg-mint-soft px-3 py-1 text-sm font-semibold text-navy">
              {t('contacts.count', { count: list.length, max: MAX_CONTACTS })}
            </p>
          </div>

          {contacts.isPending ? <Spinner label={t('account.loading')} /> : null}
          {contacts.isError ? <InfoNote tone="error" text={t('contacts.errors.generic')} /> : null}

          {contacts.isSuccess && list.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-ink-muted/50 p-6 text-center">
              <p className="m-0 text-lg text-ink-muted">{t('contacts.empty')}</p>
            </div>
          ) : null}

          {list.length > 0 ? (
            <ul className="m-0 flex list-none flex-col gap-4 p-0">
              {list.map((contact, index) => (
                <li key={contact.id}>
                  <ContactCard
                    contact={contact}
                    isPrimary={index === 0}
                    busy={mutations.makePrimary.isPending || mutations.remove.isPending}
                    onEdit={() => { setEditing(contact) }}
                    onRemove={() => { setRemoving(contact) }}
                    onMakePrimary={() => { mutations.makePrimary.mutate(contact.id) }}
                  />
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex flex-col gap-3">
            <Button disabled={atLimit || contacts.isPending} icon={<Plus className="size-5" aria-hidden />} onClick={() => { setEditing('new') }}>
              {t('contacts.add')}
            </Button>
            {atLimit ? <p className="m-0 text-sm text-ink-muted">{t('contacts.limit', { max: MAX_CONTACTS })}</p> : null}
          </div>

          <div className="flex flex-col gap-3">
            <InfoNote text={t('contacts.privacy')} />
            <p className="m-0 text-sm text-ink-muted">{t('contacts.demoStorage')}</p>
          </div>
        </section>
      </div>

      <ContactFormDialog
        open={editing !== null}
        contact={editing && editing !== 'new' ? editing : undefined}
        saving={saving}
        error={saveError}
        onSave={save}
        onClose={closeForm}
      />

      <Dialog open={removing !== null} onClose={() => { setRemoving(null) }} labelledBy="remove-title">
        <h2 id="remove-title" className="text-2xl">{t('contacts.removeTitle', { name: removing?.name ?? '' })}</h2>
        <p className="m-0 text-lg text-ink-muted">{t('contacts.removeBody')}</p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="text" onClick={() => { setRemoving(null) }}>{t('contacts.cancel')}</Button>
          <Button loading={mutations.remove.isPending} onClick={confirmRemove}>{t('contacts.removeConfirm')}</Button>
        </div>
      </Dialog>
    </div>
  )
}
