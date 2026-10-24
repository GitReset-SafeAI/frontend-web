import { PhoneCall, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { EmergencyContact } from '../../../services/contracts'
import { Card } from '../../../shared/components/Card'
import { formatPhone } from '../phone'

interface ContactCardProps {
  contact: EmergencyContact
  isPrimary: boolean
  busy?: boolean
  onEdit: () => void
  onRemove: () => void
  onMakePrimary: () => void
}

const action =
  'inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-navy hover:bg-mint-soft disabled:opacity-60'

export function ContactCard({ contact, isPrimary, busy = false, onEdit, onRemove, onMakePrimary }: ContactCardProps) {
  const { t } = useTranslation('account')
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="break-words font-display text-xl font-semibold">{contact.name}</h3>
          <p className="m-0 text-lg tabular-nums text-ink">{formatPhone(contact.phone)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isPrimary ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3 py-1 text-sm font-semibold text-white">
              <Star className="size-4" aria-hidden />
              {t('contacts.primary')}
            </span>
          ) : null}
          {contact.relationship ? (
            <span className="rounded-full bg-mint-light px-3 py-1 text-sm font-medium">{t(`contacts.relationships.${contact.relationship}`)}</span>
          ) : null}
        </div>
      </div>

      <div className="-mx-2 flex flex-wrap gap-1">
        <a href={`tel:${contact.phone}`} aria-label={t('contacts.callA11y', { name: contact.name })} className={action}>
          <PhoneCall className="size-4" aria-hidden />
          {t('contacts.call')}
        </a>
        {isPrimary ? null : (
          <button type="button" disabled={busy} aria-label={t('contacts.makePrimaryA11y', { name: contact.name })} onClick={onMakePrimary} className={action}>
            <Star className="size-4" aria-hidden />
            {t('contacts.makePrimary')}
          </button>
        )}
        <button type="button" disabled={busy} aria-label={t('contacts.editA11y', { name: contact.name })} onClick={onEdit} className={action}>
          {t('contacts.edit')}
        </button>
        <button type="button" disabled={busy} aria-label={t('contacts.removeA11y', { name: contact.name })} onClick={onRemove} className={`${action} text-danger`}>
          {t('contacts.remove')}
        </button>
      </div>
    </Card>
  )
}
