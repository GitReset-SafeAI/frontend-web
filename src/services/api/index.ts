import { z } from 'zod'

import { env } from '../../config/env'
import type { AppServices, HotspotsRequest } from '../contracts'
import { journeyShareSchema, sharedJourneySchema } from '../contracts/journeys'
import { placeSuggestionSchema } from '../contracts/places'
import { hotspotsResultSchema, routeComparisonResultSchema } from '../contracts/safetyMap'
import { ApiError } from './ApiError'
import { submitReport } from './reports'
import { createApiClient } from './client'

const client = createApiClient(env.apiBaseUrl)

// Report creation is connected; other data adapters still fail explicitly.
const notAgreed = (what: string) => async (): Promise<never> => {
  throw new ApiError('not-implemented', `The backend ${what} contract has not been agreed.`)
}

// The backend takes min_lon,min_lat,max_lon,max_lat; the app works in
// { latitude, longitude } throughout. The swap happens here, once.
function bboxParam({ bounds }: HotspotsRequest) {
  return [
    bounds.southWest.longitude,
    bounds.southWest.latitude,
    bounds.northEast.longitude,
    bounds.northEast.latitude,
  ].join(',')
}

export const apiServices: AppServices = {
  reports: {
    submitReport,
    transcribeVoice: notAgreed('transcription'),
  },
  auth: {
    subscribe() { return () => undefined },
    getSession: notAgreed('authentication'),
    signUp: notAgreed('authentication'),
    logIn: notAgreed('authentication'),
    logOut: notAgreed('authentication'),
  },
  contacts: {
    list: notAgreed('emergency contacts'),
    add: notAgreed('emergency contacts'),
    update: notAgreed('emergency contacts'),
    remove: notAgreed('emergency contacts'),
    makePrimary: notAgreed('emergency contacts'),
  },
  // Geocoding is proxied by the backend, so the provider stays off the client.
  places: {
    async searchPlaces({ query, limit = 6 }) {
      const trimmed = query.trim()
      // The endpoint requires at least two characters; asking anyway would be
      // a guaranteed 422.
      if (trimmed.length < 2) return []
      const params = new URLSearchParams({ q: trimmed, limit: String(limit) })
      return client.request(`/api/v1/safety-map/places?${params}`, z.array(placeSuggestionSchema))
    },
  },
  // A journey in progress. The owner key is held by this browser and sent only
  // on the calls that change the journey; a share link carries neither.
  journeys: {
    async start(request) {
      return client.request('/api/v1/journeys', journeyShareSchema, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: request.origin,
          destination: request.destination,
          origin_label: request.originLabel,
          destination_label: request.destinationLabel,
          geometry: request.geometry,
          duration_s: request.durationSeconds,
        }),
      })
    },
    async updatePosition(shareId, ownerKey, position, accuracyMeters) {
      return client.request(`/api/v1/journeys/${shareId}`, sharedJourneySchema, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Journey-Key': ownerKey },
        body: JSON.stringify({ position, accuracy_m: accuracyMeters }),
      })
    },
    async read(shareId) {
      return client.request(`/api/v1/journeys/${shareId}`, sharedJourneySchema)
    },
    async end(shareId, ownerKey) {
      await client.request(`/api/v1/journeys/${shareId}`, z.unknown(), {
        method: 'DELETE',
        headers: { 'X-Journey-Key': ownerKey },
      })
    },
  },
  safetyMap: {
    async getHotspots(request) {
      const query = new URLSearchParams({
        bbox: bboxParam(request),
        time_period: request.timePeriod,
      })
      if (request.windowDays) query.set('window_days', String(request.windowDays))
      return client.request(`/api/v1/safety-map/hotspots?${query}`, hotspotsResultSchema)
    },
    async compareRoutes(request) {
      return client.request('/api/v1/safety-map/routes/compare', routeComparisonResultSchema, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: request.origin,
          destination: request.destination,
          time_period: request.timePeriod,
          travel_mode: request.travelMode,
        }),
      })
    },
  },
}
