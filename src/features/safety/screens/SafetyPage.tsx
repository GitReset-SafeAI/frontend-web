import { FlaskConical, List, Map, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { env } from '../../../config/env'
import { hotspotActivityLevels } from '../../../services/contracts/hotspots'
import { Button } from '../../../shared/components/Button'
import { InfoNote } from '../../../shared/components/InfoNote'
import { Spinner } from '../../../shared/components/Spinner'
import { swatchColor } from '../components/activityStyles'
import { HotspotMapSlot } from '../components/HotspotMapSlot'
import { HotspotSummary } from '../components/HotspotSummary'
import { useHotspots } from '../hooks/useHotspots'

type ViewMode = 'map' | 'list'

const tabClass = (active: boolean) =>
  `inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full px-4 font-semibold transition-colors ${
    active ? 'bg-surface text-navy shadow-card' : 'text-ink-muted hover:text-navy'
  }`

// Phones show Map or List; large screens show both side by side. The list is also the accessible,
// text-only alternative to the map.
export function SafetyPage() {
  const { t } = useTranslation('safety')
  const { t: tc } = useTranslation()
  const [mode, setMode] = useState<ViewMode>('map')
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const { data, isPending, isError, refetch } = useHotspots()

  // Most-reported first; the sort never changes what an area's label says.
  const sorted = useMemo(() => [...(data ?? [])].sort((a, b) => b.reportCount - a.reportCount), [data])
  const selected = sorted.find((hotspot) => hotspot.id === selectedId)

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

        {/* A heat scale: pale to deep navy. "Not enough data" is dashed and empty, never a reassuring colour. */}
        <div role="group" aria-label={t('legendTitle')} className="grid max-w-xl grid-cols-4 gap-1.5">
          {hotspotActivityLevels.map((level) => (
            <div key={level} className="flex flex-col gap-1.5">
              <span className={`h-3 rounded-full border border-ink-muted/50 ${swatchColor[level]}`} aria-hidden />
              <span className="text-xs font-semibold leading-tight text-ink">{t(`levels.${level}`)}</span>
            </div>
          ))}
        </div>

        <div role="tablist" aria-label={t('viewSwitchA11y')} className="flex gap-1 rounded-full bg-mint-soft p-1 lg:hidden">
          <button type="button" role="tab" aria-selected={mode === 'map'} className={tabClass(mode === 'map')} onClick={() => { setMode('map') }}>
            <Map className="size-5" aria-hidden />{t('viewMap')}
          </button>
          <button type="button" role="tab" aria-selected={mode === 'list'} className={tabClass(mode === 'list')} onClick={() => { setMode('list') }}>
            <List className="size-5" aria-hidden />{t('viewList')}
          </button>
        </div>

        {isPending ? <Spinner label={t('loading')} /> : null}

        {isError ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <InfoNote tone="error" text={t('errorTitle')} />
            <Button icon={<RefreshCw className="size-5" aria-hidden />} onClick={() => { void refetch() }}>{tc('retry')}</Button>
          </div>
        ) : null}

        {!isPending && !isError && sorted.length === 0 ? (
          <p className="m-0 py-8 text-center text-ink-muted">{t('empty')}</p>
        ) : null}

        {sorted.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <div className={`${mode === 'map' ? 'flex' : 'hidden'} flex-col gap-4 lg:sticky lg:top-24 lg:flex lg:self-start`}>
              <HotspotMapSlot
                hotspots={sorted}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onDeselect={() => { setSelectedId(undefined) }}
              />
              {selected ? (
                <HotspotSummary hotspot={selected} onClose={() => { setSelectedId(undefined) }} />
              ) : null}
            </div>

            <ul
              aria-label={t('viewList')}
              className={`${mode === 'list' ? 'flex' : 'hidden'} m-0 list-none flex-col gap-4 p-0 lg:flex`}
            >
              {sorted.map((hotspot) => (
                <li key={hotspot.id}>
                  <HotspotSummary
                    hotspot={hotspot}
                    selected={hotspot.id === selectedId}
                    onSelect={() => { setSelectedId(hotspot.id === selectedId ? undefined : hotspot.id) }}
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  )
}
