import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Loads something from Homami (a list, a profile…) and keeps it on screen.
 *   data       undefined while loading the first time
 *   error      what went wrong last time, in words for people (or null)
 *   refresh()  loads it again. If that fails, what was already on screen stays, or `whenFailed` if nothing was.
 * Only the newest answer counts, so a slow old answer never overwrites a newer one.
 */
export function useLoader<T>(load: () => Promise<T>, whenFailed: T) {
  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const loadRef = useRef(load)
  const fallbackRef = useRef(whenFailed)
  const newest = useRef(0)
  const mounted = useRef(true)
  useEffect(() => {
    loadRef.current = load
    fallbackRef.current = whenFailed
  })
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const refresh = useCallback(async () => {
    const call = ++newest.current
    const stillWanted = () => mounted.current && call === newest.current
    try {
      const value = await loadRef.current()
      if (!stillWanted()) return
      setData(value)
      setError(null)
    } catch (err) {
      if (!stillWanted()) return
      setData((current) => current ?? fallbackRef.current)
      setError(err instanceof Error ? err.message : null)
    }
  }, [])

  return { data, error, refresh, setData }
}
