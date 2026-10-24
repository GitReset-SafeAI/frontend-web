import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '../../../shared/components/Button'
import { Dialog } from '../../../shared/components/Dialog'
import { districts } from '../districts'

interface DistrictPickerProps {
  open: boolean
  selected?: string
  onSelect: (id: string) => void
  onClose: () => void
}

export function DistrictPicker({ open, selected, onSelect, onClose }: DistrictPickerProps) {
  const { t } = useTranslation('reporting')
  const { t: tc } = useTranslation()
  const titleId = 'district-title'

  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId}>
      <h2 id={titleId} className="text-xl font-semibold">{t('when.districtTitle')}</h2>
      <ul className="m-0 grid max-h-[55svh] list-none grid-cols-2 gap-2 overflow-y-auto p-0 pr-1">
        {districts.map((district) => {
          const active = district.id === selected
          return (
            <li key={district.id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => { onSelect(district.id) }}
                className={`flex min-h-12 w-full items-center justify-between gap-2 rounded-lg px-3 text-left font-medium ${
                  active ? 'border-2 border-navy bg-mint-light' : 'border border-line hover:bg-mint-soft'
                }`}
              >
                {t(`districts.${district.id}`)}
                {active ? <Check className="size-4" aria-hidden /> : null}
              </button>
            </li>
          )
        })}
      </ul>
      <Button variant="text" onClick={onClose}>{tc('cancel')}</Button>
    </Dialog>
  )
}
