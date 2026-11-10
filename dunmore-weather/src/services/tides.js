import { ANCHOR } from '../constants'

const MARINE_SEA_LEVEL_URL =
  'https://marine-api.open-meteo.com/v1/marine' +
  `?latitude=${ANCHOR.lat}&longitude=${ANCHOR.lon}` +
  '&hourly=sea_level_height_msl&timezone=UTC&forecast_days=3'

const DAILY_TIDE_URL =
  'https://marine-api.open-meteo.com/v1/marine' +
  `?latitude=${ANCHOR.lat}&longitude=${ANCHOR.lon}` +
  '&hourly=sea_level_height_msl&timezone=UTC&forecast_days=16'

const TIME_FORMATTER = new Intl.DateTimeFormat('en-IE', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Europe/Dublin',
})

const DATE_KEY_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Dublin',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const HOUR_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Dublin',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

function parseUtcHour(stamp) {
  return new Date(`${stamp}:00Z`).getTime()
}

function localHour(at) {
  const parts = HOUR_FORMATTER.formatToParts(new Date(at))
  const hours = Number(parts.find((part) => part.type === 'hour')?.value ?? 0)
  const minutes = Number(parts.find((part) => part.type === 'minute')?.value ?? 0)
  return (hours % 24) + minutes / 60
}

function dedupeExtrema(nodes) {
  const result = []
  for (const node of nodes) {
    const last = result[result.length - 1]
    if (last && last.type === node.type && node.hour - last.hour < 2) {
      const moreExtreme =
        node.type === 'high' ? node.height > last.height : node.height < last.height
      if (moreExtreme) result[result.length - 1] = node
      continue
    }
    result.push(node)
  }
  return result
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

/**
 * Builds a 16-day tide series keyed by Dublin calendar date. Each entry has:
 *   nodes  – high/low extrema with local time, hour and height
 *   points – hourly sea-level samples for plotting the curve
 */
export async function fetchDailyTides() {
  const res = await fetch(DAILY_TIDE_URL)
  if (!res.ok) throw new Error(`Marine sea-level request failed (${res.status})`)
  const data = await res.json()

  const times = data?.hourly?.time ?? []
  const heights = data?.hourly?.sea_level_height_msl ?? []
  const byDate = new Map()

  for (let i = 0; i < heights.length; i += 1) {
    const height = heights[i]
    if (height == null) continue

    const at = parseUtcHour(times[i])
    const key = DATE_KEY_FORMATTER.format(new Date(at))
    let day = byDate.get(key)
    if (!day) {
      day = { nodes: [], points: [] }
      byDate.set(key, day)
    }

    const hour = localHour(at)
    day.points.push({ hour, height })

    if (i > 0 && i < heights.length - 1) {
      const prev = heights[i - 1]
      const next = heights[i + 1]
      if (prev == null || next == null) continue

      const isHigh = height >= prev && height >= next && (height > prev || height > next)
      const isLow = height <= prev && height <= next && (height < prev || height < next)
      if (isHigh || isLow) {
        day.nodes.push({
          type: isHigh ? 'high' : 'low',
          time: TIME_FORMATTER.format(at),
          hour,
          height,
        })
      }
    }
  }

  const keys = [...byDate.keys()].sort()
  for (let i = 0; i < keys.length - 1; i += 1) {
    const day = byDate.get(keys[i])
    const next = byDate.get(keys[i + 1])
    if (day.points.length > 0 && next.points.length > 0) {
      day.points.push({ hour: 24, height: next.points[0].height })
    }
  }

  const result = {}
  for (const [key, day] of byDate) {
    result[key] = {
      nodes: dedupeExtrema(day.nodes),
      points: day.points,
    }
  }

  return result
}
