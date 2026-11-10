import { useCallback, useEffect, useRef, useState } from 'react'
import { getProvider } from '../services/providers'
import { readCache, writeCache } from '../services/cache'

const inFlight = new Map()

function loadForecast(providerId) {
  if (!inFlight.has(providerId)) {
    const promise = getProvider(providerId)
      .forecast()
      .finally(() => inFlight.delete(providerId))
    inFlight.set(providerId, promise)
  }
  return inFlight.get(providerId)
}

function initialState(providerId) {
  return {
    provider: providerId,
    days: [],
    status: 'idle',
    isStale: false,
    fetchedAt: null,
    degraded: [],
    coverageDays: 0,
    gustEstimated: getProvider(providerId).gustEstimated,
    error: null,
  }
}

export function useMarineForecast(providerId, enabled) {
  const [state, setState] = useState(() => initialState(providerId))
  const requestRef = useRef(0)

  if (state.provider !== providerId) {
    setState(initialState(providerId))
  }

  const refresh = useCallback(
    async (force = false) => {
      const request = ++requestRef.current
      const gustEstimated = getProvider(providerId).gustEstimated

      if (!force) {
        const cached = readCache('forecast', providerId)
        const cachedDays = cached?.data.days ?? []
        const cacheHasTides =
          cachedDays.length > 0 &&
          cachedDays.every(
            (day) => Array.isArray(day.tides) && Array.isArray(day.tidePoints),
          )
        if (cached?.isFresh && cacheHasTides) {
          setState({
            ...initialState(providerId),
            days: cachedDays,
            coverageDays: cached.data.coverageDays ?? cachedDays.length,
            status: 'ready',
            fetchedAt: cached.timestamp,
          })
          return
        }
      }

      setState((prev) => ({
        ...initialState(providerId),
        status: prev.days.length ? 'refreshing' : 'loading',
        days: prev.provider === providerId ? prev.days : [],
      }))

      try {
        const result = await loadForecast(providerId)
        if (request !== requestRef.current) return
        writeCache('forecast', providerId, {
          days: result.days,
          coverageDays: result.coverageDays,
        })
        setState({
          ...initialState(providerId),
          days: result.days,
          status: 'ready',
          isStale: false,
          fetchedAt: result.fetchedAt,
          degraded: result.degraded ?? [],
          coverageDays: result.coverageDays ?? result.days.length,
          gustEstimated: Boolean(result.gustEstimated ?? gustEstimated),
          error: null,
        })
      } catch (err) {
        if (request !== requestRef.current) return
        const cached = readCache('forecast', providerId)
        if (cached) {
          setState({
            ...initialState(providerId),
            days: cached.data.days ?? [],
            coverageDays: cached.data.coverageDays ?? cached.data.days?.length ?? 0,
            status: 'ready',
            isStale: true,
            fetchedAt: cached.timestamp,
            error: err,
          })
        } else {
          setState({ ...initialState(providerId), status: 'error', error: err })
        }
      }
    },
    [providerId],
  )

  useEffect(() => {
    if (!enabled) return
    // oxlint-disable-next-line react/set-state-in-effect -- external data fetch lifecycle
    refresh()
  }, [enabled, refresh])

  return { ...state, refresh }
}
