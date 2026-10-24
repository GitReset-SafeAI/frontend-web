import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { ContactInput, ContactRelationship, EmergencyContact } from '../../../services/contracts'
import { contactRelationships } from '../../../services/contracts/account'
import { Button } from '../../../shared/components/Button'
import { ChoiceGroup } from '../../../shared/components/ChoiceGroup'
import { Dialog } from '../../../shared/components/Dialog'
import { Field } from '../../../shared/components/Field'
import { InfoNote } from '../../../shared/components/InfoNote'
import { formatPhone, normalizePhone } from '../phone'

interface ContactFormDialogProps {
  open: boolean
  // Present when editing; absent when adding.
  contact?: EmergencyContact
  saving: boolean
  // A failure from the service, already translated.
  error?: string
  onSave: (input: ContactInput) => void
  onClose: () => void
}

export function ContactFormDialog({ open, contact, saving, error, onSave, onClose }: ContactFormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} labelledBy="contact-form-title">
      <ContactForm contact={contact} saving={saving} error={error} onSave={onSave} onCancel={onClose} />
    </Dialog>
  )
}

interface ContactFormProps extends Pick<ContactFormDialogProps, 'contact' | 'saving' | 'error' | 'onSave'> {
  onCancel: () => void
}

// Mounted only while the dialog is open, so each opening starts from a clean (or the chosen contact's) state.
function ContactForm({ contact, saving, error, onSave, onCancel }: ContactFormProps) {
  const { t } = useTranslation('account')
  const [name, setName] = useState(contact?.name ?? '')
  const [phone, setPhone] = useState(contact ? formatPhone(contact.phone) : '')
  const [relationship, setRelationship] = useState<ContactRelationship | undefined>(contact?.relationship)
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const normalised = normalizePhone(phone)
    const next = {
      name: name.trim() ? undefined : t('contacts.errors.name'),
      phone: normalised ? undefined : t('contacts.errors.phone'),
    }
    setErrors(next)
    if (next.name || next.phone || !normalised) return
    onSave({ name: name.trim(), phone: normalised, relationship })
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <h2 id="contact-form-title" className="text-2xl">
        {contact ? t('contacts.formTitleEdit') : t('contacts.formTitleAdd')}
      </h2>
      <Field
        label={t('contacts.name')}
        value={name}
        onChange={(event) => { setName(event.target.value) }}
        error={errors.name}
        autoComplete="off"
        maxLength={60}
        autoFocus
      />
      <Field
        label={t('contacts.phone')}
        hint={t('contacts.phoneHint')}
        value={phone}
        onChange={(event) => { setPhone(event.target.value) }}
        error={errors.phone}
        type="tel"
        inputMode="tel"
        autoComplete="off"
      />
      <ChoiceGroup<ContactRelationship>
        label={t('contacts.relationship')}
        options={contactRelationships.map((value) => ({ value, label: t(`contacts.relationships.${value}`) }))}
        value={relationship}
        onChange={setRelationship}
      />
      {error ? <InfoNote tone="error" text={error} /> : null}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="text" disabled={saving} onClick={onCancel}>{t('contacts.cancel')}</Button>
        <Button type="submit" loading={saving}>{saving ? t('contacts.saving') : t('contacts.save')}</Button>
      </div>
    </form>
  )
}
