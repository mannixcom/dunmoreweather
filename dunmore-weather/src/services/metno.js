import { ANCHOR } from '../constants'
import { fetchTides } from './tides'

const MS_TO_KT = 1.943844
const GUST_FACTOR = 1.45

const LOCATION_URL =
  'https://api.met.no/weatherapi/locationforecast/2.0/compact' +
  `?lat=${ANCHOR.lat.toFixed(4)}&lon=${ANCHOR.lon.toFixed(4)}`

const OCEAN_URL =
  'https://api.met.no/weatherapi/oceanforecast/2.0/complete' +
  `?lat=${ANCHOR.lat.toFixed(4)}&lon=${ANCHOR.lon.toFixed(4)}`

const DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Dublin',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`MET Norway request failed (${res.status})`)
  return res.json()
}

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function numOrNull(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function seriesOf(payload) {
  return payload?.properties?.timeseries ?? []
}

function nearestEntry(series, now) {
  let best = null
  let bestDiff = Infinity
  for (const entry of series) {
    const diff = Math.abs(new Date(entry.time).getTime() - now)
    if (diff < bestDiff) {
      bestDiff = diff
      best = entry
    }
  }
  return best
}

function precipitationOf(entry) {
  const data = entry.data
  return (
    data.next_1_hours?.details?.precipitation_amount ??
    data.next_6_hours?.details?.precipitation_amount ??
    0
  )
}

function dublinDateKey(iso) {
  return DATE_FORMATTER.format(new Date(iso))
}

export async function fetchMetNoCurrent() {
  const [locationResult, oceanResult, tidesResult] = await Promise.allSettled([
    fetchJson(LOCATION_URL),
    fetchJson(OCEAN_URL),
    fetchTides(),
  ])

  if (locationResult.status === 'rejected') {
    throw locationResult.reason
  }

  const degraded = []
  const series = seriesOf(locationResult.value)
  const entry = nearestEntry(series, Date.now())
  if (!entry) throw new Error('MET Norway returned no forecast entries')

  const details = entry.data.instant.details
  const windSpeed = num(details.wind_speed) * MS_TO_KT
  const windGust = windSpeed * GUST_FACTOR

  let waveHeight = 0
  if (oceanResult.status === 'fulfilled') {
    const oceanEntry = nearestEntry(seriesOf(oceanResult.value), Date.now())
    waveHeight = num(oceanEntry?.data?.instant?.details?.sea_surface_wave_height)
  } else {
    degraded.push('marine')
  }

  const tides =
    tidesResult.status === 'fulfilled'
      ? tidesResult.value
      : { highTideTime: '—', highTideHeight: '—', source: 'Unavailable' }
  if (tidesResult.status === 'rejected') degraded.push('tides')

  return {
    telemetry: {
      airTemp: num(details.air_temperature),
      precipitation: num(precipitationOf(entry)),
      windSpeed,
      windGust,
      windDirection: num(details.wind_from_direction),
      waveHeight,
      wavePeriod: 0,
      swellHeight: waveHeight,
      highTideTime: tides.highTideTime,
      highTideHeight: tides.highTideHeight,
    },
    degraded,
    tideSource: tides.source,
    gustEstimated: true,
    fetchedAt: Date.now(),
  }
}

export async function fetchMetNoForecast() {
  const [locationResult, oceanResult] = await Promise.allSettled([
    fetchJson(LOCATION_URL),
    fetchJson(OCEAN_URL),
  ])

  if (locationResult.status === 'rejected') {
    throw locationResult.reason
  }

  const degraded = []
  if (oceanResult.status === 'rejected') degraded.push('marine')

  const byDate = new Map()

  for (const entry of seriesOf(locationResult.value)) {
    const key = dublinDateKey(entry.time)
    const details = entry.data.instant.details
    const windKt = num(details.wind_speed) * MS_TO_KT
    const gustKt = windKt * GUST_FACTOR

    let day = byDate.get(key)
    if (!day) {
      day = {
        date: key,
        windMax: -Infinity,
        gustMax: -Infinity,
        windDir: 0,
        tempMin: Infinity,
        tempMax: -Infinity,
        precip: 0,
        waveMax: null,
        wavePeriodMax: null,
        swellMax: null,
        seaKnown: false,
      }
      byDate.set(key, day)
    }

    if (windKt > day.windMax) {
      day.windMax = windKt
      day.windDir = num(details.wind_from_direction)
    }
    if (gustKt > day.gustMax) day.gustMax = gustKt

    const temp = num(details.air_temperature)
    if (temp < day.tempMin) day.tempMin = temp
    if (temp > day.tempMax) day.tempMax = temp

    day.precip += num(precipitationOf(entry))
  }

  if (oceanResult.status === 'fulfilled') {
    for (const entry of seriesOf(oceanResult.value)) {
      const key = dublinDateKey(entry.time)
      const day = byDate.get(key)
      if (!day) continue
      const wave = numOrNull(entry.data.instant.details.sea_surface_wave_height)
      if (wave == null) continue
      day.waveMax = day.waveMax == null ? wave : Math.max(day.waveMax, wave)
      day.swellMax = day.waveMax
      day.seaKnown = true
    }
  }

  const days = [...byDate.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((day) => ({
      ...day,
      windMax: Number.isFinite(day.windMax) ? day.windMax : 0,
      gustMax: Number.isFinite(day.gustMax) ? day.gustMax : 0,
      tempMin: Number.isFinite(day.tempMin) ? day.tempMin : 0,
      tempMax: Number.isFinite(day.tempMax) ? day.tempMax : 0,
    }))

  return {
    days,
    degraded,
    coverageDays: days.length,
    gustEstimated: true,
    fetchedAt: Date.now(),
  }
}
