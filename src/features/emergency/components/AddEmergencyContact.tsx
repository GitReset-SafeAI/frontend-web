import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ApiError } from '../../../services/api/ApiError'
import { MAX_CONTACTS } from '../../../services/contracts/account'
import { Button } from '../../../shared/components/Button'
import { ContactFormDialog } from '../../account/components/ContactFormDialog'
import { useContactMutations, useContacts } from '../../account/hooks/useContacts'

export function AddEmergencyContact() {
  const { t } = useTranslation('account')
  const [open, setOpen] = useState(false)
  const contacts = useContacts()
  const { add } = useContactMutations()
  const atLimit = (contacts.data?.length ?? 0) >= MAX_CONTACTS
  const close = () => { setOpen(false); if (!add.isPending) add.reset() }
  const error = add.error ? t(add.error instanceof ApiError && add.error.kind === 'limit'
    ? 'contacts.errors.limit' : 'contacts.errors.generic', { max: MAX_CONTACTS }) : undefined

  return <>
    <Button disabled={atLimit || !contacts.isSuccess || add.isPending} icon={<Plus className="size-5" aria-hidden />} onClick={() => { setOpen(true) }}>
      {t('contacts.add')}
    </Button>
    {atLimit ? <p className="m-0 text-sm">{t('contacts.limit', { max: MAX_CONTACTS })}</p> : null}
    <ContactFormDialog open={open} saving={add.isPending} error={error} onClose={close}
      onSave={(input) => { if (!add.isPending) add.mutate(input, { onSuccess: () => { setOpen(false); add.reset() } }) }} />
  </>
}
