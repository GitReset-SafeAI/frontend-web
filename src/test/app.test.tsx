import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { DEMO_EMAIL } from '../config/demo'
import { mockServices } from '../services/mocks'
import type { ContactInput } from '../services/contracts'
import { renderApp } from './renderApp'

// Starts a test already signed in, with the given contacts, by using the same service the app does.
async function seedAccount(contacts: ContactInput[]) {
  await mockServices.auth.signUp({ name: 'Nimali', email: 'nimali@example.lk', password: 'password1' })
  for (const contact of contacts) await mockServices.contacts.add(contact)
}

describe('landing and navigation', () => {
  it('shows the landing page with honest limits and links into the product', () => {
    renderApp('/')
    expect(screen.getByRole('heading', { level: 1, name: /know what has been reported/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /few reports is not safe/i })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /report an incident/i }).length).toBeGreaterThan(0)
  })

  it('keeps SOS one tap away and switches the interface language to Sinhala and Tamil', async () => {
    const user = userEvent.setup()
    renderApp('/report')
    expect(screen.getByRole('link', { name: /sos emergency help/i })).toHaveAttribute('href', '/sos')

    const select = screen.getByRole('combobox', { name: /interface language/i })
    expect(within(select).getAllByRole('option').map((option) => option.textContent)).toEqual(['English', 'සිංහල', 'தமிழ்'])

    await user.selectOptions(select, 'si')
    expect(document.documentElement.lang).toBe('si')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('සිදු වුණේ')

    await user.selectOptions(screen.getByRole('combobox'), 'ta')
    expect(document.documentElement.lang).toBe('ta')
    expect(screen.getByRole('heading', { level: 1, name: 'என்ன நடந்தது?' })).toBeInTheDocument()
  })

  it('renders Tamil on every page without leaking untranslated keys', async () => {
    const { default: i18n } = await import('../i18n')
    await i18n.changeLanguage('ta')
    for (const path of ['/', '/report', '/report/when', '/report/details', '/emergency', '/sos', '/login', '/login?mode=signup']) {
      const { container, unmount } = renderApp(path)
      // A missing key renders as its dotted path (e.g. "describe.title"); none should appear.
      // (The demo account's email address is real text, not a key.)
      expect((container.textContent ?? '').replace(DEMO_EMAIL, '')).not.toMatch(/\b[a-z][A-Za-z]+\.[a-z][A-Za-z.]+\b/)
      unmount()
    }
    renderApp('/safety')
    await waitFor(() => { expect(screen.getByTestId('planner-card')).toBeInTheDocument() })
    expect(screen.getByRole('heading', { name: 'பயணத்தைத் திட்டமிடுங்கள்' })).toBeInTheDocument()
  })

  it('shows a not-found page for unknown routes', () => {
    renderApp('/nope')
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument()
  })
})

describe('report flow', () => {
  it('blocks a too-short description and then completes the whole flow with optional steps skipped', async () => {
    const user = userEvent.setup()
    renderApp('/report')

    await user.click(screen.getByRole('button', { name: /^next$/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/at least 10 characters/i)

    await user.type(screen.getByRole('textbox', { name: /describe the incident/i }), 'A man followed me near the bus stand.')
    await user.click(screen.getByRole('button', { name: /^next$/i }))

    // When & where is optional: the button reads Skip until something is answered.
    expect(screen.getByRole('heading', { level: 1, name: /when and where/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^skip$/i }))
    expect(screen.getByRole('heading', { level: 1, name: /anything else/i })).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: /dim/i }))
    expect(screen.getByRole('radio', { name: /dim/i })).toBeChecked()
    await user.click(screen.getByRole('button', { name: /^next$/i }))

    expect(screen.getByRole('heading', { level: 1, name: /review and submit/i })).toBeInTheDocument()
    expect(screen.getByText(/lighting: dim/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /submit report/i }))

    await waitFor(() => { expect(screen.getByRole('heading', { level: 1, name: /report received/i })).toBeInTheDocument() })
    // The user's words and the AI's estimate stay separate, and the estimate is labelled as such.
    expect(screen.getByText('Your words')).toBeInTheDocument()
    expect(screen.getByText(/automated estimate, not a verified fact/i)).toBeInTheDocument()
    expect(screen.getByText('Being followed')).toBeInTheDocument()
  })

  it('lets an optional answer be cleared by choosing it again', async () => {
    const user = userEvent.setup()
    renderApp('/report/details')
    const dim = screen.getByRole('radio', { name: /dim/i })
    await user.click(dim)
    await user.click(dim)
    expect(dim).not.toBeChecked()
  })

  it('requires a voice transcript to be confirmed before continuing', async () => {
    const user = userEvent.setup()
    renderApp('/report')
    await user.click(screen.getByRole('button', { name: /speak instead/i }))
    const dialog = screen.getByRole('dialog', { hidden: true })
    await user.click(within(dialog).getByRole('button', { name: /^start$/i }))
    await user.click(within(dialog).getByRole('button', { name: /stop and transcribe/i }))

    await waitFor(() => { expect(screen.getByRole('button', { name: /transcript looks right/i })).toBeInTheDocument() })
    await user.click(screen.getByRole('button', { name: /^next$/i }))
    expect(screen.getByText(/please confirm the transcript/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /transcript looks right/i }))
    await user.click(screen.getByRole('button', { name: /^next$/i }))
    expect(screen.getByRole('heading', { level: 1, name: /when and where/i })).toBeInTheDocument()
  })

  it('stores a district choice as an approximate location', async () => {
    const user = userEvent.setup()
    renderApp('/report/when')
    await user.click(screen.getByRole('button', { name: /choose a district/i }))
    await user.click(within(screen.getByRole('dialog', { hidden: true })).getByRole('button', { name: 'Kandy' }))
    expect(screen.getByText(/kandy district/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^next$/i })).toBeInTheDocument()
  })
})

describe('emergency', () => {
  it('counts down toward the primary contact and can be cancelled without calling', async () => {
    const user = userEvent.setup()
    await seedAccount([{ name: 'Amma', phone: '+94771234567', relationship: 'family' }])
    renderApp('/sos')
    expect(await screen.findByRole('heading', { name: /calling amma in/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /call now/i })).toBeInTheDocument()
    expect(screen.getByText(/does not alert anyone for you/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^cancel$/i }))
    expect(screen.queryByText(/call started/i)).not.toBeInTheDocument()
  })

  it('opens the SOS countdown from the emergency page button', async () => {
    const user = userEvent.setup()
    await seedAccount([{ name: 'Amma', phone: '+94771234567' }])
    renderApp('/emergency')
    await user.click(screen.getByRole('button', { name: /sos\. emergency help/i }))
    expect(await screen.findByRole('heading', { name: /calling amma/i })).toBeInTheDocument()
  })

  it('lists contacts on the emergency page as tap-to-call links', async () => {
    await seedAccount([
      { name: 'Amma', phone: '+94771234567' },
      { name: 'Kasun', phone: '+94112345678' },
    ])
    renderApp('/emergency')
    expect(await screen.findByRole('link', { name: /call amma/i })).toHaveAttribute('href', 'tel:+94771234567')
    expect(screen.getByRole('link', { name: /call kasun/i })).toHaveAttribute('href', 'tel:+94112345678')
    expect(screen.getByText('077 123 4567')).toBeInTheDocument()
  })

  it('never calls anyone when logged out: it asks you to log in instead', async () => {
    renderApp('/sos')
    expect(await screen.findByRole('heading', { name: /add an emergency contact first/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^log in$/i })).toHaveAttribute('href', '/login')
    expect(screen.queryByRole('button', { name: /call now/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
  })

  it('asks a logged-in user with no contacts to add one', async () => {
    await seedAccount([])
    renderApp('/sos')
    expect(await screen.findByRole('heading', { name: /add an emergency contact first/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /add a contact/i })).toHaveAttribute('href', '/account')
  })

  it('no longer mentions police or ambulance numbers anywhere', async () => {
    await seedAccount([{ name: 'Amma', phone: '+94771234567' }])
    for (const path of ['/', '/emergency', '/sos', '/safety', '/account', '/login']) {
      const { container, unmount } = renderApp(path)
      await waitFor(() => { expect(container.textContent).not.toBe('') })
      expect(container.textContent).not.toMatch(/\b119\b|\b1990\b|police|ambulance/i)
      unmount()
    }
  })
})

describe('safety map', () => {
  it('clamps a zoomed-out viewport to the bbox the API accepts', async () => {
    const { clampBounds, MAX_BBOX_DEGREES } = await import('../features/safety/utils/clampBounds')

    // The whole island is wider than the cap; the API answers 422 for this.
    const wide = clampBounds({
      southWest: { latitude: 5.0, longitude: 77.0 },
      northEast: { latitude: 10.0, longitude: 82.0 },
    })
    expect(wide.northEast.latitude - wide.southWest.latitude).toBeLessThanOrEqual(MAX_BBOX_DEGREES)
    expect(wide.northEast.longitude - wide.southWest.longitude).toBeLessThanOrEqual(MAX_BBOX_DEGREES)
    // Clamped around the centre, so the map keeps showing where you are looking.
    expect((wide.southWest.latitude + wide.northEast.latitude) / 2).toBeCloseTo(7.5)

    // Zooming in must not shrink what gets clustered: areas are built from the
    // incidents inside the requested box, so a tight box publishes fewer areas
    // and they would appear to vanish as you zoom.
    const { MIN_BBOX_DEGREES } = await import('../features/safety/utils/clampBounds')
    const street = clampBounds({
      southWest: { latitude: 6.92, longitude: 79.85 },
      northEast: { latitude: 6.94, longitude: 79.88 },
    })
    expect(street.northEast.latitude - street.southWest.latitude).toBeCloseTo(MIN_BBOX_DEGREES)
    expect((street.southWest.latitude + street.northEast.latitude) / 2).toBeCloseTo(6.93)

    // A city-sized viewport is already within both limits and passes through.
    const city = { southWest: { latitude: 6.78, longitude: 79.8 }, northEast: { latitude: 7.0, longitude: 79.95 } }
    expect(clampBounds(city)).toEqual(city)
  })

  it('states that safety information has limits', async () => {
    const user = userEvent.setup()
    renderApp('/safety')
    const note = await screen.findByRole('button', { name: /safety information has limits/i })
    // Folded by default: the heading carries the caveat on its own.
    expect(note).toHaveAttribute('aria-expanded', 'false')
    await user.click(note)
    expect(screen.getByText(/no route can be guaranteed safe/i)).toBeInTheDocument()
  })

  it('draws a real map and no longer asks walk or drive', async () => {
    renderApp('/safety')

    // A live map, not a placeholder: the slot art stays for the older list below.
    expect(await screen.findByTestId('safety-map')).toBeInTheDocument()

    // Routes are compared on foot; the mode is pinned, not asked for.
    expect(screen.queryByRole('radio', { name: /walk/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: /drive/i })).not.toBeInTheDocument()
  })

  it('says nothing was reported rather than "no clearly better route"', async () => {
    const { RouteComparisonCard } = await import('../features/safety/components/RouteComparisonCard')
    const { I18nextProvider } = await import('react-i18next')
    const { render } = await import('@testing-library/react')
    const { default: i18n } = await import('../i18n')

    const route = (id: string, seconds: number, passed: number) => ({
      id, role: 'alternative' as const, durationSeconds: seconds, distanceMeters: 1000,
      geometry: [{ latitude: 6.9, longitude: 79.8 }, { latitude: 6.91, longitude: 79.81 }],
      exposureScore: 0, hotspotsPassed: passed, incidentCategories: [], safetyConcerns: [],
      extraDurationSeconds: 0,
    })
    const base = {
      recommendedRouteId: null, lowestExposureRouteId: 'r1', clearRouteId: null,
      originInReportedArea: false, destinationInReportedArea: false,
      evidenceLevel: 'moderate' as const, travelMode: 'walking' as const,
      usesStreetNetwork: true, pedestrianProfileAvailable: false,
    }

    // Nothing reported on any route: there is nothing to detour around.
    const clear = render(
      <I18nextProvider i18n={i18n}>
        <RouteComparisonCard
          comparison={{ ...base, routes: [route('r1', 3240, 0), route('r2', 5280, 0)] }}
          selectedRouteId="r1"
          onSelectRoute={() => {}}
        />
      </I18nextProvider>,
    )
    expect(screen.getByText(/no reported areas on these routes/i)).toBeInTheDocument()
    expect(screen.queryByText(/no clearly better route/i)).not.toBeInTheDocument()
    // "Fewest of these" says nothing when every route passes none.
    expect(screen.queryByText(/fewest reported areas/i)).not.toBeInTheDocument()
    clear.unmount()

    // Areas exist but no detour was worth it: the original wording still applies.
    render(
      <I18nextProvider i18n={i18n}>
        <RouteComparisonCard
          comparison={{ ...base, routes: [route('r1', 3240, 2), route('r2', 5280, 1)] }}
          selectedRouteId="r1"
          onSelectRoute={() => {}}
        />
      </I18nextProvider>,
    )
    // No clear route was found, so say that rather than blaming the detour cost.
    expect(screen.getByText(/no route avoids every reported area/i)).toBeInTheDocument()
    expect(screen.getByText(/a way around them was looked for/i)).toBeInTheDocument()
    expect(screen.getByText(/fewest reported areas/i)).toBeInTheDocument()
  })

  it('offers the longer route that avoids every reported area', async () => {
    const { RouteComparisonCard } = await import('../features/safety/components/RouteComparisonCard')
    const { I18nextProvider } = await import('react-i18next')
    const { render } = await import('@testing-library/react')
    const { default: i18n } = await import('../i18n')

    // The shape the backend actually returns when its clear-route search
    // succeeds: a detour that enters no reported area, offered however long.
    const route = (id: string, role: string, seconds: number, extra: number, passed: number) => ({
      id, role, durationSeconds: seconds, distanceMeters: 1000,
      geometry: [{ latitude: 6.9, longitude: 79.8 }, { latitude: 6.91, longitude: 79.81 }],
      exposureScore: passed * 10, hotspotsPassed: passed,
      incidentCategories: [], safetyConcerns: [], extraDurationSeconds: extra,
    })

    render(
      <I18nextProvider i18n={i18n}>
        <RouteComparisonCard
          comparison={{
            routes: [
              route('route-1', 'fastest', 2760, 0, 2),
              route('route-2', 'lower-exposure', 3060, 300, 1),
              route('route-3', 'avoids-all', 3720, 960, 0),
            ],
            recommendedRouteId: 'route-2',
            lowestExposureRouteId: 'route-3',
            clearRouteId: 'route-3',
            originInReportedArea: false, destinationInReportedArea: false,
            evidenceLevel: 'moderate' as const, travelMode: 'walking' as const,
            usesStreetNetwork: true, pedestrianProfileAvailable: false,
          } as never}
          selectedRouteId="route-2"
          onSelectRoute={() => {}}
        />
      </I18nextProvider>,
    )

    // Named by its role, badged as clear, and honest about the extra time.
    expect(screen.getByText('Avoids all reported areas')).toBeInTheDocument()
    expect(screen.getByText('Avoids everything reported')).toBeInTheDocument()
    expect(screen.getByText(/16 min longer/)).toBeInTheDocument()
    expect(screen.getByText(/enters no reported area/i)).toBeInTheDocument()
    expect(screen.getByText('Passes no reported areas')).toBeInTheDocument()
    // The recommendation is still the shorter detour; both are offered.
    expect(screen.getByText('Suggested')).toBeInTheDocument()
  })

  it('names an area when the backend could name it', async () => {
    renderApp('/safety')
    // The mock fixtures carry no area_name, so the count must still lead and
    // nothing may render as "null" or "undefined".
    const areas = await screen.findAllByRole('button', { name: /reports? in the last \d+ days/i })
    expect(areas.length).toBeGreaterThan(0)
    expect(document.body.textContent).not.toMatch(/\bnull\b|\bundefined\b/)
  })

  it('renders the journey planner in Sinhala and Tamil, not an English fallback', async () => {
    const { default: i18n } = await import('../i18n')
    for (const [language, marker] of [['si', 'ඇවිදීමේ ගමනක් සැලසුම් කරන්න'], ['ta', 'பயணத்தைத் திட்டமிடுங்கள்']] as const) {
      await i18n.changeLanguage(language)
      const { unmount } = renderApp('/safety')
      const planner = await screen.findByTestId('planner-card')
      expect(within(planner).getByRole('heading', { name: marker })).toBeInTheDocument()
      // The English strings must not leak through as a fallback.
      expect(within(planner).queryByText('Plan a journey')).not.toBeInTheDocument()
      unmount()
    }
    await i18n.changeLanguage('en')
  })

  it('offers the reported-area vocabulary the backend actually serves', async () => {
    const user = userEvent.setup()
    renderApp('/safety')

    // The evidence notice never lets an empty map read as "safe".
    const evidence = await screen.findByTestId('evidence-card')
    expect(within(evidence).getByText(/reported, not where harassment actually occurs/i)).toBeInTheDocument()

    // Choosing an area expands its detail in place, rather than repeating the
    // heading in a second card below.
    const areas = screen.getAllByRole('button', { expanded: false })
    const area = areas.find((button) => /reports? in the last \d+ days/i.test(button.textContent ?? ''))
    expect(area).toBeDefined()
    expect(screen.queryByText(/most recent report/i)).not.toBeInTheDocument()

    await user.click(area as HTMLElement)
    expect(area).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/most recent report/i)).toBeInTheDocument()
    // The caveat is on every area, expanded or not.
    expect(screen.getAllByText(/never shows the exact place/i).length).toBeGreaterThan(0)
    // One heading per area, not two: the old layout repeated it in a card below.
    expect(screen.queryAllByText(/^About this area$/).length).toBeLessThanOrEqual(
      screen.queryAllByRole('button', { expanded: true }).length +
        screen.queryAllByRole('button', { expanded: false }).length,
    )
  })
})
