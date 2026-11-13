import { useEffect } from 'react'
import { listFeed } from '../lib/posts'
import type { Post } from '../lib/posts'
import { listSitters } from '../lib/sitters'
import type { SitterListing } from '../lib/sitters'
import { listOpenRequests, listRequestsOf } from '../lib/requests'
import type { CareRequest, RequestListing } from '../lib/requests'
import { getExtendedCircle } from '../lib/circle'
import type { CircleMember } from '../lib/circle'
import { useLoader } from './useLoader'

/** What the wall needs: posts, pet sitters and people asking for care, loaded whenever Home opens so new ones show up */
export function useWall(userId: string, route: string) {
  const feed = useLoader<Post[]>(listFeed, [])
  const sitters = useLoader<SitterListing[]>(() => listSitters(userId), [])
  const openRequests = useLoader<RequestListing[]>(() => listOpenRequests(userId), [])
  const extended = useLoader<CircleMember[]>(getExtendedCircle, [])
  const { refresh: refreshFeed } = feed
  const { refresh: refreshSitters } = sitters
  const { refresh: refreshRequests } = openRequests
  const { refresh: refreshExtended } = extended
  useEffect(() => {
    if (route !== '/') return
    refreshFeed()
    refreshSitters()
    refreshRequests()
  }, [route, userId, refreshFeed, refreshSitters, refreshRequests])
  // The extended circle places sitters on the wall, and has its own page under Circle
  useEffect(() => {
    if (route === '/' || route === '/circle/extended') refreshExtended()
  }, [route, refreshExtended])
  return {
    feed: feed.data,
    setFeed: feed.setData,
    sitters: sitters.data,
    /** After your pet sitting changes, the wall loads sitters again */
    forgetSitters: () => sitters.setData(undefined),
    openRequests: openRequests.data,
    extended: extended.data,
  }
}

/** Your own pet care requests. Loaded on their own, so a missing database script 10 never blocks the app. */
export function useMyRequests(userId: string) {
  const { data: requests, refresh, setData: setRequests } = useLoader<CareRequest[]>(() => listRequestsOf(userId), [])
  useEffect(() => {
    refresh()
  }, [refresh, userId])
  return { requests, setRequests }
}
