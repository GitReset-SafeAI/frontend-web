import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { env } from '../config/env'
import { MapEvidenceNotice } from '../features/safety/components/MapEvidenceNotice'
import { SafetyAreaList } from '../features/safety/components/SafetyAreaList'
import { hotspotColor, hotspotFill, intensityBand } from '../features/safety/constants/issueTypes'
import i18n from '../i18n'
import { selectServices } from '../services'
import { apiServices } from '../services/api'
import { mockServices } from '../services/mocks'

const wire = {
  generated_at: '2026-10-24T12:00:00Z', window_days: 30,
  min_reports_per_hotspot: 3, suppressed_area_count: 0, evidence_level: 'limited',
  hotspots: [{
    id: 'database-area', center: { latitude: 6.92, longitude: 79.85 }, radius_m: 180,
    report_count: 7, intensity: 0.8, top_incident_categories: ['UNWANTED_FOLLOWING'],
    top_safety_concerns: [], peak_time_period: 'evening', most_recent_report_days_ago: 1,
    mean_confidence: 0.7, evidence_level: 'limited',
  }],
}

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('database map integration', () => {
  it('selects the API map independently of other demo services', () => {
    const previousMode = env.safetyMapMode
    try {
      env.safetyMapMode = 'api'
      expect(selectServices('mock', 'demo').safetyMap).toBe(apiServices.safetyMap)
      expect(selectServices('mock', 'demo').reports).toBe(mockServices.reports)
    } finally { env.safetyMapMode = previousMode }
  })

  it('uses backend counts, coordinates and intensity without fabricating a severity value', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(wire), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const result = await apiServices.safetyMap.getHotspots({
      bounds: { southWest: { latitude: 6.78, longitude: 79.8 }, northEast: { latitude: 7, longitude: 79.95 } },
      timePeriod: 'all', windowDays: 30,
    })
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/safety-map/hotspots?bbox=79.8%2C6.78%2C79.95%2C7&time_period=all&window_days=30')
    expect(result.hotspots[0]).toMatchObject({ reportCount: 7, intensity: 0.8, center: { latitude: 6.92, longitude: 79.85 } })
    expect(result.hotspots[0]).not.toHaveProperty('severity')
    render(<I18nextProvider i18n={i18n}>
      <SafetyAreaList hotspots={result.hotspots} windowDays={30} selectedId={null} onSelect={() => undefined} />
      <MapEvidenceNotice result={result} />
    </I18nextProvider>)
    expect(screen.getByText('7 reports in the last 30 days')).toBeInTheDocument()
    expect(screen.getByText('Severity-weighted intensity: Highest')).toBeInTheDocument()
    expect(screen.getByText(/not raw severity or a safety rating/)).toBeInTheDocument()
  })

  it('does not fall back to synthetic incidents when the backend is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 503 })))
    await expect(apiServices.safetyMap.getHotspots({
      bounds: { southWest: { latitude: 6.78, longitude: 79.8 }, northEast: { latitude: 7, longitude: 79.95 } }, timePeriod: 'all',
    })).rejects.toThrow()
  })
})

describe('severity-weighted shades', () => {
  it.each([[0, 'lower'], [0.249, 'lower'], [0.25, 'moderate'], [0.5, 'higher'], [0.75, 'highest'], [1, 'highest']] as const)(
    'assigns intensity %s to %s', (value, band) => { expect(intensityBand(value)).toBe(band) },
  )
  it('uses progressively distinct shades and clamps invalid values', () => {
    expect(new Set([0, 0.25, 0.5, 1].map(hotspotColor)).size).toBe(4)
    expect(hotspotColor(-2)).toBe(hotspotColor(0))
    expect(hotspotColor(5)).toBe(hotspotColor(1))
    expect(hotspotFill(1)).toBe('#991b1b66')
  })
})
