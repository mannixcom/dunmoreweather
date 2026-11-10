import { useCallback, useEffect, useRef, useState } from 'react'
import { getProvider } from '../services/providers'
import { readCache, writeCache } from '../services/cache'

const inFlight = new Map()

function loadCurrent(providerId) {
  if (!inFlight.has(providerId)) {
    const promise = getProvider(providerId)
      .current()
      .finally(() => inFlight.delete(providerId))
    inFlight.set(providerId, promise)
  }
  return inFlight.get(providerId)
}

function initialState(providerId) {
  return {
    provider: providerId,
    telemetry: null,
    status: 'loading',
    isStale: false,
    fetchedAt: null,
    degraded: [],
    tideSource: null,
    gustEstimated: getProvider(providerId).gustEstimated,
    error: null,
  }
}

export function useMarineTelemetry(providerId) {
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
        const cached = readCache('weather', providerId)
        if (cached?.isFresh) {
          setState({
            ...initialState(providerId),
            telemetry: cached.data,
            status: 'ready',
            fetchedAt: cached.timestamp,
          })
          return
        }
      }

      setState((prev) => ({
        ...initialState(providerId),
        status: prev.telemetry ? 'refreshing' : 'loading',
        telemetry: prev.provider === providerId ? prev.telemetry : null,
      }))

      try {
        const result = await loadCurrent(providerId)
        if (request !== requestRef.current) return
        writeCache('weather', providerId, result.telemetry)
        setState({
          ...initialState(providerId),
          telemetry: result.telemetry,
          status: 'ready',
          isStale: false,
          fetchedAt: result.fetchedAt,
          degraded: result.degraded ?? [],
          tideSource: result.tideSource ?? null,
          gustEstimated: Boolean(result.gustEstimated ?? gustEstimated),
          error: null,
        })
      } catch (err) {
        if (request !== requestRef.current) return
        const cached = readCache('weather', providerId)
        if (cached) {
          setState({
            ...initialState(providerId),
            telemetry: cached.data,
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
    // oxlint-disable-next-line react/set-state-in-effect -- external data fetch lifecycle
    refresh()
  }, [refresh])

  return { ...state, refresh }
}
