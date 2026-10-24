import { FlaskConical, List, Map, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { env } from '../../../config/env'
import { hotspotActivityLevels } from '../../../services/contracts/hotspots'
import { Button } from '../../../shared/components/Button'
import { InfoNote } from '../../../shared/components/InfoNote'
import { Spinner } from '../../../shared/components/Spinner'
import { ActivityBadge } from '../components/ActivityBadge'
import { HotspotMapSlot } from '../components/HotspotMapSlot'
import { HotspotSummary } from '../components/HotspotSummary'
import { useHotspots } from '../hooks/useHotspots'

type ViewMode = 'map' | 'list'

const tabClass = (active: boolean) =>
  `inline-flex min-h-12 flex-1 items-center justify-center gap-2 px-4 font-semibold ${
    active ? 'bg-tint text-ink underline decoration-2 underline-offset-4' : 'bg-surface text-ink-muted hover:bg-tint-soft'
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
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4">
        <h1 className="text-[1.75rem] font-bold sm:text-4xl ta:text-2xl ta:sm:text-3xl">{t('mapTitle')}</h1>

        {env.dataMode === 'mock' ? (
          <p className="m-0 inline-flex items-center gap-2 text-sm font-semibold text-warning">
            <FlaskConical className="size-[18px]" aria-hidden />
            {tc('sampleData')}
          </p>
        ) : null}
        <p className="m-0 text-ink-muted">{t('note')}</p>

        <div className="flex flex-wrap gap-x-5 gap-y-2" role="group" aria-label={t('legendTitle')}>
          {hotspotActivityLevels.map((level) => <ActivityBadge key={level} activity={level} />)}
        </div>

        <div role="tablist" aria-label={t('viewSwitchA11y')} className="flex overflow-hidden rounded-sm border border-ink-muted lg:hidden">
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
