import {
  CACHE_KEYS,
  CACHE_PREFIX,
  CACHE_TTL_MS,
  FORECAST_TTL_MS,
  MET_CACHE_TTL_MS,
} from '../constants'

const TTL_BY_KIND = {
  weather: CACHE_TTL_MS,
  forecast: FORECAST_TTL_MS,
}

function ttlFor(kind, provider) {
  if (provider === 'met-no' || provider === 'met-eireann') return MET_CACHE_TTL_MS
  return TTL_BY_KIND[kind] ?? CACHE_TTL_MS
}

function storageKey(kind, provider) {
  return `${CACHE_PREFIX}_${kind}_${provider}`
}

export function readCache(kind, provider) {
  try {
    const base = storageKey(kind, provider)
    const raw = localStorage.getItem(base)
    const time = Number(localStorage.getItem(`${base}_time`))
    if (!raw || !time) return null

    const data = JSON.parse(raw)
    const age = Date.now() - time
    const ttl = ttlFor(kind, provider)
    return {
      data,
      timestamp: time,
      age,
      isFresh: age >= 0 && age < ttl,
    }
  } catch {
    return null
  }
}

export function writeCache(kind, provider, data) {
  try {
    const base = storageKey(kind, provider)
    const now = Date.now()
    localStorage.setItem(base, JSON.stringify(data))
    localStorage.setItem(`${base}_time`, String(now))
    return now
  } catch {
    return null
  }
}

export function readGearState() {
  try {
    const raw = localStorage.getItem(CACHE_KEYS.gear)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function writeGearState(state) {
  try {
    localStorage.setItem(CACHE_KEYS.gear, JSON.stringify(state))
  } catch {
    /* storage unavailable — checklist stays in memory */
  }
}

export function readProvider() {
  try {
    return localStorage.getItem(CACHE_KEYS.provider)
  } catch {
    return null
  }
}

export function writeProvider(provider) {
  try {
    localStorage.setItem(CACHE_KEYS.provider, provider)
  } catch {
    /* ignore */
  }
}
