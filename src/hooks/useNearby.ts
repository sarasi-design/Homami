import { useCallback, useEffect, useState } from 'react'
import { findMe, getMyLocation, isMissingLocation, listSitterSpots, nearCountLabel, removeMyLocation, saveMyLocation, townFor } from '../lib/location'
import type { Coords, SitterSpot } from '../lib/location'

const load = (userId: string) => Promise.all([getMyLocation(userId).catch(() => null), listSitterSpots().catch(() => [])])

/**
 * Your rough location and the pet sitters on the map (database script 21), loaded on Home and on the map.
 * `locate()` is what every pin does: find you, keep it rounded to ~1 km, save it, and say how many sitters are near.
 */
export function useNearby(userId: string, route: string) {
  const [me, setMe] = useState<Coords | null | undefined>(undefined)
  /** undefined while loading · null before database script 21 */
  const [spots, setSpots] = useState<SitterSpot[] | null | undefined>(undefined)

  const refresh = useCallback(async () => {
    const [mine, list] = await load(userId)
    setMe(mine)
    setSpots(list)
    return list
  }, [userId])

  useEffect(() => {
    if (route !== '/' && route !== '/sitters/map') return
    let cancelled = false
    load(userId).then(([mine, list]) => {
      if (cancelled) return
      setMe(mine)
      setSpots(list)
    })
    return () => {
      cancelled = true
    }
  }, [route, userId])

  /** Returns the town to fill in and "4 pet sitters near you" */
  const locate = useCallback(async () => {
    const here = await findMe()
    const [place] = await Promise.all([
      townFor(here),
      saveMyLocation(here).catch((e) => {
        // Before script 21 the town still fills in; anything else is a real problem
        if (!isMissingLocation(e)) throw e
      }),
    ])
    const list = await refresh()
    const note = list ? `${nearCountLabel(list.filter((s) => s.near).length)}. Only your rough area is kept, never your address.` : undefined
    return { place, note }
  }, [refresh])

  /** "Remove my location": the rough area is deleted, so distances and "near you" go too */
  const forget = useCallback(async () => {
    await removeMyLocation(userId)
    await refresh()
  }, [userId, refresh])

  return { me, spots, locate, forget, refresh }
}
