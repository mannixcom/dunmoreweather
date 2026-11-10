import { ANCHOR } from '../constants'

const MARINE_SEA_LEVEL_URL =
  'https://marine-api.open-meteo.com/v1/marine' +
  `?latitude=${ANCHOR.lat}&longitude=${ANCHOR.lon}` +
  '&hourly=sea_level_height_msl&timezone=UTC&forecast_days=3'

const TIME_FORMATTER = new Intl.DateTimeFormat('en-IE', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Europe/Dublin',
})

function parseUtcHour(stamp) {
  return new Date(`${stamp}:00Z`).getTime()
}

/**
 * Derives the next high-tide node from Open-Meteo marine sea-level heights.
 * The spec names a dedicated "Open Waters Tides API"; set VITE_TIDES_API_URL
 * to a JSON endpoint returning { highTideTime, highTideHeight } to use it.
 * Without configuration we fall back to the no-key marine model.
 */
export async function fetchTides() {
  const configured = import.meta.env.VITE_TIDES_API_URL
  if (configured) {
    try {
      const res = await fetch(configured)
      if (res.ok) {
        const data = await res.json()
        if (data.highTideTime) {
          return {
            highTideTime: data.highTideTime,
            highTideHeight: data.highTideHeight ?? '—',
            source: 'Open Waters Tides API',
          }
        }
      }
    } catch {
      /* fall through to marine fallback */
    }
  }

  const res = await fetch(MARINE_SEA_LEVEL_URL)
  if (!res.ok) throw new Error(`Marine sea-level request failed (${res.status})`)
  const data = await res.json()

  const times = data?.hourly?.time ?? []
  const heights = data?.hourly?.sea_level_height_msl ?? []
  const now = Date.now()

  for (let i = 1; i < heights.length - 1; i += 1) {
    const h = heights[i]
    if (h == null) continue
    const isPeak = h > heights[i - 1] && h >= heights[i + 1]
    const at = parseUtcHour(times[i])
    if (isPeak && at > now) {
      return {
        highTideTime: TIME_FORMATTER.format(at),
        highTideHeight: `${h.toFixed(1)}m`,
        source: 'Open-Meteo marine model',
      }
    }
  }

  return {
    highTideTime: '—',
    highTideHeight: '—',
    source: 'Unavailable',
  }
}
