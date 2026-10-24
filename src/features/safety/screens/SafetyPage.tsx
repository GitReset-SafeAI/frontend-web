import { FlaskConical } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { env } from '../../../config/env'
import { SafetyMapSection } from './SafetyMapSection'

// One safety map, on the contract the backend actually serves. The earlier
// placeholder slot and its separate area list were removed once the real map
// landed: they read from a hotspot contract that was never agreed, so in `api`
// mode they could only ever fail.
export function SafetyPage() {
  const { t } = useTranslation('safety')
  const { t: tc } = useTranslation()

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-4">
        <h1 className="display-lg">{t('mapTitle')}</h1>

        {env.dataMode === 'mock' ? (
          <p className="m-0 inline-flex w-fit items-center gap-2 rounded-full bg-[#fff3d6] px-4 py-1.5 text-sm font-semibold text-warning">
            <FlaskConical className="size-[18px]" aria-hidden />
            {tc('sampleData')}
          </p>
        ) : null}
        <p className="m-0 max-w-2xl text-lg text-ink-muted">{t('note')}</p>

        <SafetyMapSection />
      </div>
    </div>
  )
}
