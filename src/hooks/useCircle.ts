import { useCallback, useEffect, useState } from 'react'
import { getInviteOwner, getMyCircle, getMyInviteCode, joinCircle, listMyInviteCodes } from '../lib/circle'
import type { CircleMember, InviteCode } from '../lib/circle'
import { clearInviteFromLink, inviteFromLink } from '../lib/inviteLink'
import { go } from '../lib/router'
import { useLoader } from './useLoader'

export interface PendingInvite {
  code: string
  id: string
  name: string
  photoUrl: string | null
}

/**
 * Your circle and your personal invite code. Opening someone's invite link while logged in asks
 * "Add Sara to your circle?" (unless it's yours, or you're already connected).
 */
export function useCircle(userId: string) {
  const [circle, setCircle] = useState<CircleMember[] | undefined>(undefined)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [pendingInvite, setPendingInvite] = useState<PendingInvite | null>(null)
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  const refreshCircle = useCallback(() => {
    getMyCircle().then(setCircle).catch(() => setCircle([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    getMyInviteCode(userId).then((c) => !cancelled && setInviteCode(c)).catch(() => {})
    getMyCircle()
      .then((list) => {
        if (cancelled) return
        setCircle(list)
        const code = inviteFromLink()
        if (!code) return
        getInviteOwner(code)
          .then((owner) => {
            if (cancelled) return
            if (!owner || owner.id === userId || list.some((m) => m.id === owner.id)) return clearInviteFromLink()
            setPendingInvite({ code, id: owner.id, name: owner.first_name ?? 'your friend', photoUrl: owner.avatar_url })
          })
          .catch(clearInviteFromLink)
      })
      .catch(() => !cancelled && setCircle([]))
    return () => {
      cancelled = true
    }
  }, [userId])

  const acceptInvite = async () => {
    if (!pendingInvite) return
    setJoining(true)
    setJoinError(null)
    try {
      await joinCircle(pendingInvite.code)
      clearInviteFromLink()
      setPendingInvite(null)
      refreshCircle()
      go(`/people/${pendingInvite.id}`)
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setJoining(false)
    }
  }
  const declineInvite = () => {
    clearInviteFromLink()
    setPendingInvite(null)
  }

  return { circle, inviteCode, pendingInvite, joining, joinError, acceptInvite, declineInvite }
}

/** Your one-time invite codes (database script 12), loaded when you open Your profile */
export function useInviteCodes(userId: string, route: string) {
  const { data: codes, refresh } = useLoader<InviteCode[]>(() => listMyInviteCodes(userId), [])
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (route === '/profile') refresh()
  }, [route, refresh])
  /** Makes or removes a code, then shows the list again (with what went wrong, if it did) */
  const run = async (action: () => Promise<unknown>) => {
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
    await refresh()
  }
  return { codes, error, run }
}
