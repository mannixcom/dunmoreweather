import { useCallback, useEffect, useState } from 'react'

export function useCooldown(durationMs) {
  const [until, setUntil] = useState(0)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (now >= until) return
    const id = setTimeout(() => setNow(Date.now()), 1000)
    return () => clearTimeout(id)
  }, [now, until])

  const remaining = until > now ? Math.ceil((until - now) / 1000) : 0

  const start = useCallback(() => {
    const current = Date.now()
    setNow(current)
    setUntil(current + durationMs)
  }, [durationMs])

  return { remaining, active: remaining > 0, start }
}
