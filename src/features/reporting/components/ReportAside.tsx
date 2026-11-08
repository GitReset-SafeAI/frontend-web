import { Bot, Lock, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AsidePanel } from '../../../shared/components/AsidePanel'

export function ReportAside({ hideAiNote = false }: { hideAiNote?: boolean }) {
  const { t } = useTranslation('reporting')
  return (
    <AsidePanel
      title={t('aside.title')}
      items={[
        { icon: Lock, text: t('review.privacy') },
        { icon: MapPin, text: t('when.whereHint') },
        ...(hideAiNote ? [] : [{ icon: Bot, text: t('review.aiNote') }]),
      ]}
    />
  )
}
