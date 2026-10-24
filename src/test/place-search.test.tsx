import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MapPin } from 'lucide-react'
import { useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { JourneyPlanner, type PlannerPoint } from '../features/safety/components/JourneyPlanner'
import { PlaceSearchField } from '../features/safety/components/PlaceSearchField'
import i18n from '../i18n'
import { services } from '../services'
import type { PlaceSuggestion } from '../services/contracts'

const colombo: PlaceSuggestion = { id: 'colombo', name: 'Colombo Fort', context: 'Colombo', coordinate: { latitude: 6.93, longitude: 79.85 } }
const galle: PlaceSuggestion = { id: 'galle', name: 'Galle', context: 'Southern Province', coordinate: { latitude: 6.03, longitude: 80.22 } }

afterEach(() => { vi.restoreAllMocks() })

function field(initialValue = '') {
  const select = vi.fn()
  const clear = vi.fn()
  function Harness() {
    const [value, setValue] = useState(initialValue)
    return <I18nextProvider i18n={i18n}>
      <PlaceSearchField label="Start" Icon={MapPin} value={value} placeholder="Search"
        onSelect={(place) => { setValue(place.name); select(place) }}
        onClear={() => { setValue(''); clear() }} />
      <button>Outside</button>
    </I18nextProvider>
  }
  render(<Harness />)
  return { input: screen.getByRole('combobox', { name: 'Start' }), select, clear }
}

describe('journey place search', () => {
  it('keeps the selected name on focus and invalidates old coordinates when edited', async () => {
    vi.spyOn(services.places, 'searchPlaces').mockResolvedValue([colombo])
    const user = userEvent.setup()
    const { input, clear } = field('Colombo Fort')
    await user.click(input)
    expect(input).toHaveValue('Colombo Fort')
    expect(clear).not.toHaveBeenCalled()
    await user.type(input, ' station')
    expect(clear).toHaveBeenCalledTimes(1)
    expect(input).toHaveValue('Colombo Fort station')
  })

  it('supports keyboard selection, Escape, and dismissal outside the field', async () => {
    vi.spyOn(services.places, 'searchPlaces').mockResolvedValue([colombo, galle])
    const user = userEvent.setup()
    const { input, select } = field()
    await user.type(input, 'Co')
    await screen.findByRole('option', { name: /Colombo Fort/ })
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(screen.getByRole('option', { name: /Galle/ })).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{Enter}')
    expect(select).toHaveBeenCalledWith(galle)
    expect(input).toHaveValue('Galle')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    await user.click(input)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    await user.click(input)
    await user.click(screen.getByRole('button', { name: 'Outside' }))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('does not display stale suggestions or let an older request replace a newer query', async () => {
    let finishOld!: (places: PlaceSuggestion[]) => void
    const lookup = vi.spyOn(services.places, 'searchPlaces')
      .mockImplementationOnce(() => new Promise((resolve) => { finishOld = resolve }))
      .mockResolvedValueOnce([galle])
    const user = userEvent.setup()
    const { input } = field()
    await user.type(input, 'Colombo')
    await waitFor(() => { expect(lookup).toHaveBeenCalledTimes(1) })
    await user.clear(input)
    await user.type(input, 'Galle')
    await screen.findByRole('option', { name: /Galle/ })
    await act(async () => { finishOld([colombo]) })
    expect(screen.queryByRole('option', { name: /Colombo Fort/ })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Galle/ })).toBeInTheDocument()
  })

  it('labels saved landmarks during an outage and retries live search', async () => {
    const lookup = vi.spyOn(services.places, 'searchPlaces').mockRejectedValueOnce(new Error('503')).mockResolvedValueOnce([colombo])
    const user = userEvent.setup()
    const { input, select } = field()
    await user.type(input, 'Colombo')
    expect(await screen.findByText(/Showing saved public landmarks/)).toBeInTheDocument()
    expect(screen.getAllByRole('option').length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: 'Retry live search' }))
    await screen.findByRole('option', { name: /^Colombo Fort/ })
    expect(lookup).toHaveBeenCalledTimes(2)
    expect(screen.queryByText(/Showing saved public landmarks/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('option', { name: /^Colombo Fort/ }))
    expect(select).toHaveBeenCalledWith(colombo)
  })

  it('distinguishes provider failure from a successful empty search', async () => {
    vi.spyOn(services.places, 'searchPlaces').mockRejectedValueOnce(new Error('503')).mockResolvedValueOnce([])
    const user = userEvent.setup()
    const { input } = field()
    await user.type(input, 'zzzzzzz')
    expect(await screen.findByText(/Place search is unavailable/)).toBeInTheDocument()
    expect(screen.queryByText(/No matching place found/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry live search' }))
    expect(await screen.findByText(/No matching place found/)).toBeInTheDocument()
  })

  it('sets both journey endpoints and disables comparison again when a selected name changes', async () => {
    vi.spyOn(services.places, 'searchPlaces').mockImplementation(async ({ query }) => query === 'Colombo' ? [colombo] : [galle])
    const compare = vi.fn()
    const focus = vi.fn()
    function Harness() {
      const [origin, setOrigin] = useState<PlannerPoint | null>(null)
      const [destination, setDestination] = useState<PlannerPoint | null>(null)
      return <I18nextProvider i18n={i18n}><JourneyPlanner origin={origin} destination={destination} isLocating={false} isComparing={false}
        onSelectPlace={(target, place) => { (target === 'origin' ? setOrigin : setDestination)({ label: place.name, coordinate: place.coordinate }) }}
        onClearPoint={(target) => { (target === 'origin' ? setOrigin : setDestination)(null) }}
        onCompare={() => compare(origin?.coordinate, destination?.coordinate)} onFocusField={focus} onSwap={() => undefined} onUseCurrentLocation={() => undefined} /></I18nextProvider>
    }
    const user = userEvent.setup()
    render(<Harness />)
    const start = screen.getByRole('combobox', { name: 'Start' })
    const destination = screen.getByRole('combobox', { name: 'Destination' })
    const button = screen.getByRole('button', { name: 'Compare routes' })
    await user.type(start, 'Colombo')
    expect(focus).toHaveBeenLastCalledWith('origin')
    await user.click(await screen.findByRole('option', { name: /Colombo Fort/ }))
    await user.type(destination, 'Galle')
    expect(focus).toHaveBeenLastCalledWith('destination')
    await user.click(await screen.findByRole('option', { name: /Galle/ }))
    await user.click(button)
    expect(compare).toHaveBeenCalledWith(colombo.coordinate, galle.coordinate)
    await user.click(start)
    expect(start).toHaveValue('Colombo Fort')
    await user.type(start, ' changed')
    expect(button).toBeDisabled()
  })
})
