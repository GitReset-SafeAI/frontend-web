import { MapPin, X, type LucideIcon } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { services } from '../../../services'
import type { PlaceSuggestion } from '../../../services/contracts'
import { searchSavedPlaces } from '../../../services/places/savedPlaces'
import { Spinner } from '../../../shared/components/Spinner'

interface PlaceSearchFieldProps {
  label: string
  Icon: LucideIcon
  value: string
  placeholder: string
  testId?: string
  onSelect: (place: PlaceSuggestion) => void
  onClear: () => void
  onFocus?: () => void
}

export function PlaceSearchField({ label, Icon, value, placeholder, testId, onSelect, onClear, onFocus }: PlaceSearchFieldProps) {
  const { t } = useTranslation('safety')
  const inputId = useId()
  const listId = useId()
  // Keep text anchored to its selected value. External swaps/location changes
  // display immediately, while typing clears the previous coordinate selection.
  const [input, setInput] = useState({ selectedValue: value, text: value })
  const text = input.selectedValue === value ? input.text : value
  const query = text.trim()
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ key: string; places: PlaceSuggestion[]; failed: boolean }>({ key: '', places: [], failed: false })
  const searchable = open && query.length >= 2
  const key = `${query}\u0000${attempt}`
  const currentResult = result.key === key
  const visible = searchable && currentResult ? result.places : []
  const searching = searchable && !currentResult
  // Keep lookup failures distinct from an empty result, even with saved landmarks.
  const failed = searchable && currentResult && result.failed
  const activePlace = visible[activeIndex]

  useEffect(() => {
    if (!searchable) return
    let active = true
    const timer = setTimeout(async () => {
      try {
        const places = await services.places.searchPlaces({ query, limit: 6 })
        if (active) setResult({ key, places, failed: false })
      } catch {
        // These are existing public landmarks, never synthetic incidents.
        if (active) setResult({ key, places: searchSavedPlaces(query, 6), failed: true })
      }
    }, 250)
    return () => { active = false; clearTimeout(timer) }
  }, [searchable, query, key])

  const handleSelect = (place: PlaceSuggestion) => {
    setInput({ selectedValue: place.name, text: place.name })
    setActiveIndex(-1)
    setOpen(false)
    onSelect(place)
  }

  const handleClear = () => {
    setInput({ selectedValue: '', text: '' })
    setActiveIndex(-1)
    setOpen(false)
    onClear()
  }

  return (
    <div
      className={`relative flex flex-col gap-1.5 ${open ? 'z-30' : 'z-10'}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) { setOpen(false); setActiveIndex(-1) }
      }}
    >
      <label htmlFor={inputId} className="text-sm font-semibold text-ink">{label}</label>
      <div className="flex items-center gap-2 rounded-md border border-ink-muted/60 bg-surface px-3 focus-within:border-navy focus-within:ring-2 focus-within:ring-navy/20">
        <Icon className="size-5 shrink-0 text-ink-muted" aria-hidden />
        <input
          id={inputId}
          data-testid={testId}
          type="text"
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={searchable}
          aria-controls={searchable ? listId : undefined}
          aria-activedescendant={activePlace ? `${listId}-${activeIndex}` : undefined}
          value={text}
          placeholder={placeholder}
          onFocus={() => { setOpen(true); onFocus?.() }}
          onChange={(event) => {
            setInput({ selectedValue: '', text: event.target.value })
            setActiveIndex(-1)
            setOpen(true)
            if (value) onClear()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') { event.preventDefault(); setOpen(false); setActiveIndex(-1) }
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              setOpen(true)
              if (visible.length) setActiveIndex((index) => event.key === 'ArrowDown'
                ? (index + 1) % visible.length : (index <= 0 ? visible.length - 1 : index - 1))
            }
            if (event.key === 'Enter' && visible.length && !event.nativeEvent.isComposing) {
              event.preventDefault()
              handleSelect(activePlace ?? visible[0])
            }
          }}
          className="min-h-12 w-full border-0 bg-transparent text-base text-ink outline-none placeholder:text-ink-muted/80"
        />
        {text ? (
          <button type="button" aria-label={t('planner.clearField', { field: label })} onClick={handleClear}
            className="grid size-9 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-mint-soft hover:text-navy">
            <X className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {searchable ? (
        <div className="absolute inset-x-0 top-full z-30 mt-1 max-h-80 overflow-y-auto rounded-md border border-line/70 bg-surface shadow-lift">
          {searching ? <div role="status" className="p-4"><Spinner label={t('planner.searching')} /></div> : null}
          {failed ? (
            <div className="p-4 text-sm text-ink-muted">
              <p role="status" className="m-0">{t(visible.length ? 'planner.savedResults' : 'planner.searchFailed')}</p>
              <button type="button" onClick={() => { setAttempt((current) => current + 1); setActiveIndex(-1) }} className="mt-2 min-h-10 font-semibold text-navy underline">
                {t('planner.retrySearch')}
              </button>
            </div>
          ) : null}
          {!searching && !failed && visible.length === 0 ? <p role="status" className="m-0 p-4 text-sm text-ink-muted">{t('planner.noResults')}</p> : null}
          <div id={listId} role="listbox" aria-label={label} aria-busy={searching}>
            {visible.map((place, index) => (
              <button key={place.id} id={`${listId}-${index}`} type="button" role="option" tabIndex={-1}
                aria-selected={index === activeIndex}
                onPointerDown={(event) => { event.preventDefault() }}
                onClick={() => { handleSelect(place) }}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-mint-soft ${index === activeIndex ? 'bg-mint-soft' : ''} ${index > 0 ? 'border-t border-line/70' : ''}`}>
                <MapPin className="mt-0.5 size-5 shrink-0 text-ink-muted" aria-hidden />
                <span className="flex flex-col">
                  <span className="font-medium text-ink">{place.name}</span>
                  <span className="text-sm text-ink-muted">{place.context}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
