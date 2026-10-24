import { useTranslation } from 'react-i18next'

import { ButtonLink } from '../../shared/components/Button'

export function NotFoundPage() {
  const { t } = useTranslation('web')
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">{t('notFound.title')}</h1>
      <p className="m-0 text-lg text-ink-muted">{t('notFound.body')}</p>
      <ButtonLink to="/">{t('notFound.home')}</ButtonLink>
    </div>
  )
}
