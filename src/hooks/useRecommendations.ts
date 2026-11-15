import { useCallback, useEffect, useState } from 'react'
import { clearSitterLink, getMyShareCode, getPublicSitterPage, listRecommendations, listSittersToRecommend, pendingSitterLink } from '../lib/recommendations'
import type { Recommendation } from '../lib/recommendations'
import { go } from '../lib/router'

const seenKey = (userId: string) => `homami:recommendations-seen:${userId}`

function readSeen(userId: string): string {
  try {
    return localStorage.getItem(seenKey(userId)) ?? ''
  } catch {
    return ''
  }
}

const notNowKey = (userId: string) => `homami:recommend-not-now:${userId}`

/** Sitters you said "Not now" to on Home (remembered on this phone) */
function readNotNow(userId: string): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(notNowKey(userId)) ?? '[]')
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

/**
 * Recommendations around you (database script 20):
 *   - as a pet sitter: who recommended you, your page's link, and how many are new since you last looked
 *     (remembered on this phone; the badge on your photo and the note on Your profile)
 *   - as an owner: sitters who joined with your invite and you haven't recommended yet, unless you said
 *     "Not now" on Home (remembered on this phone; Sara, Nov 15, 2026). You can still recommend them from their profile.
 *   - a sitter's link opened before logging in: once you're in, it takes you to that sitter
 */
export function useRecommendations(userId: string, isSitter: boolean, route: string) {
  const [mine, setMine] = useState<Recommendation[] | undefined>(undefined)
  const [shareCode, setShareCode] = useState<string | null>(null)
  const [toRecommend, setToRecommend] = useState<{ id: string; first_name: string | null; avatar_url: string | null }[]>([])
  const [seen, setSeen] = useState(() => readSeen(userId))
  const [notNow, setNotNow] = useState(() => readNotNow(userId))
  /** "Not now" on Home: the banner for this sitter goes and doesn't come back */
  const skipRecommending = useCallback(
    (sitterId: string) => {
      setNotNow((list) => {
        const next = list.includes(sitterId) ? list : [...list, sitterId]
        try {
          localStorage.setItem(notNowKey(userId), JSON.stringify(next))
        } catch {
          // private browsing: it hides for now, and may show again next time
        }
        return next
      })
    },
    [userId],
  )

  const refresh = useCallback(() => {
    if (isSitter) {
      listRecommendations(userId).then(setMine).catch(() => setMine([]))
      getMyShareCode(userId).then(setShareCode).catch(() => {})
    }
    listSittersToRecommend().then(setToRecommend).catch(() => {})
  }, [userId, isSitter])

  // Fresh on Home and on Your profile, so new recommendations show up
  useEffect(() => {
    if (route === '/' || route === '/profile') refresh()
  }, [route, refresh])

  // Opened a sitter's link before logging in or signing up: go to them now
  useEffect(() => {
    const link = pendingSitterLink()
    if (!link) return
    let cancelled = false
    getPublicSitterPage(link.code)
      .then((page) => {
        if (cancelled) return
        clearSitterLink()
        if (!page) return
        if (page.id === userId) go('/profile')
        else go(link.intent === 'recommend' ? `/recommend/${page.id}` : `/people/${page.id}`)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [userId])

  const newCount = isSitter && mine ? mine.filter((r) => r.created_at > seen).length : 0
  const markSeen = useCallback(() => {
    if (!mine || mine.length === 0) return
    const latest = mine.reduce((m, r) => (r.created_at > m ? r.created_at : m), '')
    if (latest <= seen) return
    try {
      localStorage.setItem(seenKey(userId), latest)
    } catch {
      // private browsing: it just shows again next time
    }
    setSeen(latest)
  }, [mine, seen, userId])

  return {
    mine: isSitter ? mine : undefined,
    shareCode: isSitter ? shareCode : null,
    toRecommend: toRecommend.filter((s) => !notNow.includes(s.id)),
    skipRecommending,
    newCount,
    seen,
    markSeen,
    refresh,
  }
}
