import { ANCHOR } from '../constants'
import { fetchTides } from './tides'

const WEATHER_URL =
  'https://api.open-meteo.com/v1/forecast' +
  `?latitude=${ANCHOR.lat}&longitude=${ANCHOR.lon}` +
  '&current=temperature_2m,precipitation,wind_speed_10m,wind_gusts_10m,wind_direction_10m' +
  '&wind_speed_unit=kn&timezone=auto'

const MARINE_URL =
  'https://marine-api.open-meteo.com/v1/marine' +
  `?latitude=${ANCHOR.lat}&longitude=${ANCHOR.lon}` +
  '&current=wave_height,wave_period,swell_wave_height&timezone=auto'

const WEATHER_DAILY_URL =
  'https://api.open-meteo.com/v1/forecast' +
  `?latitude=${ANCHOR.lat}&longitude=${ANCHOR.lon}` +
  '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,' +
  'wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant' +
  '&forecast_days=16&wind_speed_unit=kn&timezone=auto'

const MARINE_DAILY_URL =
  'https://marine-api.open-meteo.com/v1/marine' +
  `?latitude=${ANCHOR.lat}&longitude=${ANCHOR.lon}` +
  '&daily=wave_height_max,wave_period_max,swell_wave_height_max' +
  '&forecast_days=16&timezone=auto'

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  return res.json()
}

function withModel(url, model) {
  return model ? `${url}&models=${encodeURIComponent(model)}` : url
}

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function numOrNull(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function fetchOpenMeteoMarineCurrent() {
  return fetchJson(MARINE_URL)
}

export function fetchOpenMeteoMarineDaily() {
  return fetchJson(MARINE_DAILY_URL)
}

export async function fetchMarineTelemetry(options = {}) {
  const [weatherResult, marineResult, tidesResult] = await Promise.allSettled([
    fetchJson(withModel(WEATHER_URL, options.model)),
    fetchOpenMeteoMarineCurrent(),
    fetchTides(),
  ])

  if (weatherResult.status === 'rejected') {
    throw weatherResult.reason
  }

  const degraded = []
  const current = weatherResult.value?.current ?? {}

  const marine = marineResult.status === 'fulfilled' ? marineResult.value?.current ?? {} : {}
  if (marineResult.status === 'rejected') degraded.push('marine')

  const tides =
    tidesResult.status === 'fulfilled'
      ? tidesResult.value
      : { highTideTime: '—', highTideHeight: '—', source: 'Unavailable' }
  if (tidesResult.status === 'rejected') degraded.push('tides')

  const telemetry = {
    airTemp: num(current.temperature_2m),
    precipitation: num(current.precipitation),
    windSpeed: num(current.wind_speed_10m),
    windGust: num(current.wind_gusts_10m),
    windDirection: num(current.wind_direction_10m),
    waveHeight: num(marine.wave_height),
    wavePeriod: num(marine.wave_period),
    swellHeight: num(marine.swell_wave_height),
    highTideTime: tides.highTideTime,
    highTideHeight: tides.highTideHeight,
  }

  return {
    telemetry,
    degraded,
    tideSource: tides.source,
    fetchedAt: Date.now(),
  }
}

export async function fetchOpenMeteoForecast(options = {}) {
  const [weatherResult, marineResult] = await Promise.allSettled([
    fetchJson(withModel(WEATHER_DAILY_URL, options.model)),
    fetchOpenMeteoMarineDaily(),
  ])

  if (weatherResult.status === 'rejected') {
    throw weatherResult.reason
  }

  const degraded = []
  const w = weatherResult.value?.daily ?? {}
  const m = marineResult.status === 'fulfilled' ? marineResult.value?.daily ?? {} : {}
  if (marineResult.status === 'rejected') degraded.push('marine')

  const dates = w.time ?? []
  const days = []
  dates.forEach((date, i) => {
    const windMax = numOrNull(w.wind_speed_10m_max?.[i])
    const tempMax = numOrNull(w.temperature_2m_max?.[i])
    const tempMin = numOrNull(w.temperature_2m_min?.[i])
    if (windMax == null || tempMax == null || tempMin == null) return

    const waveMax = numOrNull(m.wave_height_max?.[i])
    days.push({
      date,
      windMax,
      gustMax: numOrNull(w.wind_gusts_10m_max?.[i]) ?? windMax,
      windDir: num(w.wind_direction_10m_dominant?.[i]),
      waveMax,
      wavePeriodMax: numOrNull(m.wave_period_max?.[i]),
      swellMax: numOrNull(m.swell_wave_height_max?.[i]),
      tempMin,
      tempMax,
      precip: num(w.precipitation_sum?.[i]),
      seaKnown: waveMax != null,
    })
  })

  return {
    days,
    degraded,
    coverageDays: days.length,
    fetchedAt: Date.now(),
  }
}
