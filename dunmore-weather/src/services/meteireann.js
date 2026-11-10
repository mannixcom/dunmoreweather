import { ANCHOR } from '../constants'
import { fetchTides } from './tides'
import { fetchOpenMeteoMarineCurrent, fetchOpenMeteoMarineDaily } from './weather'

const MS_TO_KT = 1.943844

// Met Éireann serves the endpoint over HTTP only, so requests are routed via
// a same-origin proxy (Vite dev server, Vercel function, or Netlify function).
// Set VITE_MET_EIREANN_PROXY_URL to use a different proxy.
const PROXY_URL = import.meta.env.VITE_MET_EIREANN_PROXY_URL || '/api/met-eireann'

const DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Dublin',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function endpoint() {
  const separator = PROXY_URL.includes('?') ? '&' : '?'
  return `${PROXY_URL}${separator}lat=${ANCHOR.lat}&long=${ANCHOR.lon}`
}

async function fetchDocument() {
  const res = await fetch(endpoint(), { headers: { Accept: 'application/xml' } })
  if (!res.ok) throw new Error(`Met Éireann request failed (${res.status})`)
  const text = await res.text()
  const doc = new DOMParser().parseFromString(text, 'application/xml')
  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Met Éireann returned invalid XML')
  }
  return doc
}

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function numOrNull(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function locationOf(node) {
  return node.getElementsByTagName('location')[0] ?? null
}

function attr(loc, tag, name) {
  const el = loc?.getElementsByTagName(tag)[0]
  return el ? el.getAttribute(name) : null
}

function parseSeries(doc) {
  const nodes = Array.from(doc.getElementsByTagName('time')).filter(
    (node) => node.getAttribute('datatype') === 'forecast',
  )

  const instant = []
  const intervals = []

  for (const node of nodes) {
    const loc = locationOf(node)
    if (!loc) continue

    const from = node.getAttribute('from')
    const to = node.getAttribute('to')

    if (from !== to) {
      const precip = loc.getElementsByTagName('precipitation')[0]
      intervals.push({
        from,
        to,
        precip: precip ? num(precip.getAttribute('value')) : 0,
      })
    } else {
      instant.push({
        from,
        to,
        temp: num(attr(loc, 'temperature', 'value')),
        windKt: num(attr(loc, 'windSpeed', 'mps')) * MS_TO_KT,
        gustKt: num(attr(loc, 'windGust', 'mps')) * MS_TO_KT,
        dir: num(attr(loc, 'windDirection', 'deg')),
      })
    }
  }

  return { instant, intervals }
}

function nearest(entries, now) {
  let best = null
  let bestDiff = Infinity
  for (const entry of entries) {
    const diff = Math.abs(new Date(entry.from).getTime() - now)
    if (diff < bestDiff) {
      best = entry
      bestDiff = diff
    }
  }
  return best
}

function currentPrecipitation(intervals, now) {
  const active = intervals.find((entry) => {
    const from = new Date(entry.from).getTime()
    const to = new Date(entry.to).getTime()
    return now >= from && now < to
  })
  return active ?? nearest(intervals, now)
}

export async function fetchMetEireannCurrent() {
  const [xmlResult, marineResult, tidesResult] = await Promise.allSettled([
    fetchDocument(),
    fetchOpenMeteoMarineCurrent(),
    fetchTides(),
  ])

  if (xmlResult.status === 'rejected') {
    throw xmlResult.reason
  }

  const now = Date.now()
  const series = parseSeries(xmlResult.value)
  const instant = nearest(series.instant, now)
  if (!instant) throw new Error('Met Éireann returned no forecast entries')

  const degraded = []

  const marine = marineResult.status === 'fulfilled' ? marineResult.value?.current ?? {} : {}
  if (marineResult.status === 'rejected') degraded.push('marine')

  const tides =
    tidesResult.status === 'fulfilled'
      ? tidesResult.value
      : { highTideTime: '—', highTideHeight: '—', source: 'Unavailable' }
  if (tidesResult.status === 'rejected') degraded.push('tides')

  return {
    telemetry: {
      airTemp: instant.temp,
      precipitation: num(currentPrecipitation(series.intervals, now)?.precip),
      windSpeed: instant.windKt,
      windGust: instant.gustKt,
      windDirection: instant.dir,
      waveHeight: num(marine.wave_height),
      wavePeriod: num(marine.wave_period),
      swellHeight: num(marine.swell_wave_height),
      highTideTime: tides.highTideTime,
      highTideHeight: tides.highTideHeight,
    },
    degraded,
    tideSource: tides.source,
    gustEstimated: false,
    fetchedAt: Date.now(),
  }
}

export async function fetchMetEireannForecast() {
  const [xmlResult, marineResult] = await Promise.allSettled([
    fetchDocument(),
    fetchOpenMeteoMarineDaily(),
  ])

  if (xmlResult.status === 'rejected') {
    throw xmlResult.reason
  }

  const degraded = []
  if (marineResult.status === 'rejected') degraded.push('marine')

  const series = parseSeries(xmlResult.value)
  const byDate = new Map()

  for (const entry of series.instant) {
    const key = DATE_FORMATTER.format(new Date(entry.from))
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
      }
      byDate.set(key, day)
    }

    if (entry.windKt >= day.windMax) {
      day.windMax = entry.windKt
      day.windDir = entry.dir
    }
    if (entry.gustKt > day.gustMax) day.gustMax = entry.gustKt
    if (entry.temp < day.tempMin) day.tempMin = entry.temp
    if (entry.temp > day.tempMax) day.tempMax = entry.temp
  }

  for (const entry of series.intervals) {
    const day = byDate.get(DATE_FORMATTER.format(new Date(entry.from)))
    if (day) day.precip += entry.precip
  }

  const marineDaily = marineResult.status === 'fulfilled' ? marineResult.value?.daily ?? {} : {}
  const marineIndex = new Map((marineDaily.time ?? []).map((date, i) => [date, i]))

  const days = [...byDate.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((day) => {
      const index = marineIndex.get(day.date)
      const waveMax = index == null ? null : numOrNull(marineDaily.wave_height_max?.[index])
      return {
        ...day,
        windMax: Number.isFinite(day.windMax) ? day.windMax : 0,
        gustMax: Number.isFinite(day.gustMax) ? day.gustMax : 0,
        tempMin: Number.isFinite(day.tempMin) ? day.tempMin : 0,
        tempMax: Number.isFinite(day.tempMax) ? day.tempMax : 0,
        waveMax,
        wavePeriodMax:
          index == null ? null : numOrNull(marineDaily.wave_period_max?.[index]),
        swellMax:
          index == null ? null : numOrNull(marineDaily.swell_wave_height_max?.[index]),
        seaKnown: waveMax != null,
      }
    })

  return {
    days,
    degraded,
    coverageDays: days.length,
    gustEstimated: false,
    fetchedAt: Date.now(),
  }
}
