import { MapPin, X, type LucideIcon } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { services } from '../../../services'
import type { PlaceSuggestion } from '../../../services/contracts'
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

export function PlaceSearchField({
  label,
  Icon,
  value,
  placeholder,
  testId,
  onSelect,
  onClear,
  onFocus,
}: PlaceSearchFieldProps) {
  const { t } = useTranslation('safety')
  const inputId = useId()
  const listId = useId()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  // Distinct from an honest empty result: the search itself could not be
  // reached, so the message should send you to the map instead of implying
  // the place just does not exist.
  const [searchFailed, setSearchFailed] = useState(false)

  const searchable = open && query.trim().length >= 2
  // Derived rather than cleared in the effect, so a short query simply shows
  // nothing instead of triggering another render pass.
  const visible = searchable ? suggestions : []

  useEffect(() => {
    if (!searchable) return
    let active = true
    // Debounced so typing does not fire a lookup per keystroke.
    const timer = setTimeout(async () => {
      if (active) { setSearching(true); setSearchFailed(false) }
      try {
        const results = await services.places.searchPlaces({ query, limit: 6 })
        if (active) setSuggestions(results)
      } catch {
        if (active) { setSuggestions([]); setSearchFailed(true) }
      } finally {
        if (active) setSearching(false)
      }
    }, 250)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [searchable, query])

  const handleSelect = (place: PlaceSuggestion) => {
    setQuery('')
    setSuggestions([])
    setOpen(false)
    onSelect(place)
  }

  const handleClear = () => {
    setQuery('')
    setSuggestions([])
    setOpen(false)
    onClear()
  }

  return (
    <div className="relative flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-semibold text-ink">{label}</label>
      <div className="flex items-center gap-2 rounded-md border border-ink-muted/60 bg-surface px-3 focus-within:border-navy focus-within:ring-2 focus-within:ring-navy/20">
        <Icon className="size-5 shrink-0 text-ink-muted" aria-hidden />
        <input
          id={inputId}
          data-testid={testId}
          type="text"
          autoComplete="off"
          role="combobox"
          aria-expanded={searchable}
          aria-controls={searchable ? listId : undefined}
          value={open ? query : value}
          placeholder={placeholder}
          onFocus={() => { setOpen(true); onFocus?.() }}
          onChange={(event) => { setQuery(event.target.value) }}
          className="min-h-12 w-full border-0 bg-transparent text-base text-ink outline-none placeholder:text-ink-muted/80"
        />
        {value || query ? (
          <button
            type="button"
            aria-label={t('planner.clearField', { field: label })}
            onClick={handleClear}
            className="grid size-9 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-mint-soft hover:text-navy"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {searchable ? (
        <div
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-md border border-line/70 bg-surface shadow-lift"
        >
          {searching && visible.length === 0 ? (
            <div className="p-4"><Spinner label={t('planner.searching')} /></div>
          ) : null}
          {!searching && visible.length === 0 ? (
            <p className="m-0 p-4 text-sm text-ink-muted">
              {t(searchFailed ? 'planner.searchUnavailable' : 'planner.noResults')}
            </p>
          ) : null}
          {visible.map((place, index) => (
            <button
              key={place.id}
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => { handleSelect(place) }}
              className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-mint-soft ${
                index > 0 ? 'border-t border-line/70' : ''
              }`}
            >
              <MapPin className="mt-0.5 size-5 shrink-0 text-ink-muted" aria-hidden />
              <span className="flex flex-col">
                <span className="font-medium text-ink">{place.name}</span>
                <span className="text-sm text-ink-muted">{place.context}</span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
