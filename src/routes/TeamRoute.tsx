import { useEffect, useState } from 'react'
import { TeamPage } from '../screens/TeamPage'
import { getTeamOverview, listInterestTaps, listTeamMembers } from '../lib/admin'
import type { InterestTap, TeamMember, TeamOverview } from '../lib/admin'

/** #/admin: loads the team numbers, members and interest taps (database script 19) */
export function TeamRoute({ onOpenPerson, onBack }: { onOpenPerson: (id: string) => void; onBack: () => void }) {
  const [overview, setOverview] = useState<TeamOverview | null>(null)
  const [members, setMembers] = useState<TeamMember[] | null>(null)
  const [taps, setTaps] = useState<InterestTap[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([getTeamOverview(), listTeamMembers(), listInterestTaps()])
      .then(([o, m, t]) => {
        if (cancelled) return
        setOverview(o)
        setMembers(m)
        setTaps(t)
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.'))
    return () => {
      cancelled = true
    }
  }, [])

  return <TeamPage overview={overview} members={members} taps={taps} error={error} onOpenPerson={onOpenPerson} onBack={onBack} />
}
