import { useTranslation } from 'react-i18next'

import { ButtonLink } from '../../../shared/components/Button'
import { InfoNote } from '../../../shared/components/InfoNote'

interface NoContactPromptProps {
  reason: 'loggedOut' | 'noContacts'
  // Where to come back to after logging in.
  returnTo: string
  // On the red SOS screen the buttons use the light variants.
  onRed?: boolean
}

// SOS has nobody to call yet. Say so plainly and offer the one next step, instead of a dead end.
export function NoContactPrompt({ reason, returnTo, onRed = false }: NoContactPromptProps) {
  const { t } = useTranslation('emergency')
  const state = { from: returnTo }

  const actions = reason === 'loggedOut' ? (
    <>
      <ButtonLink to="/login" state={state} variant={onRed ? 'light' : 'primary'}>{t('none.login')}</ButtonLink>
      <ButtonLink to="/login?mode=signup" state={state} variant={onRed ? 'outlineLight' : 'secondary'}>{t('none.signup')}</ButtonLink>
    </>
  ) : (
    <ButtonLink to="/account" variant={onRed ? 'light' : 'primary'}>{t('none.add')}</ButtonLink>
  )
  const text = reason === 'loggedOut' ? t('none.loggedOut') : t('none.noContacts')

  if (onRed) {
    return (
      <>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="display-md text-white">{t('none.title')}</h1>
          <p className="m-0 max-w-md text-lg">{text}</p>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-col gap-3 p-6">{actions}</div>
      </>
    )
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg bg-mint-soft p-6">
      <h2 className="font-sans text-lg font-bold tracking-normal">{t('none.title')}</h2>
      <InfoNote text={text} />
      <div className="flex flex-col gap-3 sm:flex-row [&>*]:flex-1">{actions}</div>
    </div>
  )
}
