import { useState } from 'react'
import { LocateFixed } from 'lucide-react'
import { Button } from '../components/basics/Button'
import { Note } from '../components/basics/Note'
import { Header } from '../components/blocks/Header'
import { TextLink } from '../components/basics/TextLink'
import { SitterMap } from '../components/blocks/SitterMap'
import type { MapSitter } from '../components/blocks/SitterMap'
import { SitterPostCard } from '../components/blocks/SitterPostCard'
import type { SitterPostCardProps } from '../components/blocks/SitterPostCard'
import { locationNeedsUpdate, nearCountLabel } from '../lib/location'

/**
 * Pet sitters near you — a map (Sara, Nov 15, 2026; database script 21), opened from the Sitters filter on Home.
 *   "4 pet sitters near you", the map with each sitter's photo at their rough spot, and under it the card of the
 *   sitter you tapped (the same card as on the wall), which opens their profile.
 *   Without your location: the sitters still show, with "Use my location" to see who's near you.
 *   Before database script 21: a note saying so.
 *   With your location: "Only your rough area is kept" and Remove my location (Nov 15, 2026).
 */
export interface SittersMapProps {
  /** undefined while loading · null before database script 21 */
  sitters: (MapSitter & { card: Omit<SitterPostCardProps, 'onOpen'>; near: boolean })[] | null | undefined
  me: { lat: number; lng: number } | null
  onLocate: () => Promise<void>
  /** Remove my location */
  onForget?: () => Promise<void>
  onOpenSitter: (id: string) => void
  onBack: () => void
}

export function SittersMap({ sitters, me, onLocate, onForget, onOpenSitter, onBack }: SittersMapProps) {
  const [picked, setPicked] = useState<string | null>(null)
  const [finding, setFinding] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const selected = sitters?.find((s) => s.id === picked) ?? sitters?.[0] ?? null
  const nearCount = sitters?.filter((s) => s.near).length ?? 0
  const forget = async () => {
    if (!onForget) return
    setProblem(null)
    try {
      await onForget()
    } catch (e) {
      setProblem(e instanceof Error ? e.message : 'We couldn’t remove your location. Please try again.')
    }
  }
  const locate = async () => {
    setFinding(true)
    setProblem(null)
    try {
      await onLocate()
    } catch (e) {
      setProblem(e instanceof Error ? e.message : 'We couldn’t find where you are. Please try again.')
    } finally {
      setFinding(false)
    }
  }
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
      <Header title="Pet sitters near you" onBack={onBack} />
      <div className="flex flex-1 flex-col gap-l px-l pt-s pb-[40px]">
        {sitters === null ? (
          <Note title="The map is almost ready">{locationNeedsUpdate}</Note>
        ) : (
          <>
            {me ? (
              <div className="flex flex-col">
                <p className="text-body-bold text-dark-grey" aria-live="polite">
                  {sitters === undefined ? 'Looking for pet sitters…' : nearCountLabel(nearCount)}
                </p>
                <p className="text-label text-medium-grey">
                  Only your rough area is kept, never your address.{' '}
                  {onForget && <TextLink onClick={forget}>Remove my location</TextLink>}
                </p>
                {problem && <p className="text-caption text-error">{problem}</p>}
              </div>
            ) : (
              <Note title="See who’s near you">
                <span className="flex flex-col gap-s">
                  Add your location to see how far each pet sitter is. Only your rough area is kept, never your address.
                  <Button variant="dark" size="small" iconLeft={LocateFixed} className="self-start" disabled={finding} aria-busy={finding || undefined} onClick={locate}>
                    {finding ? 'Finding you…' : 'Use my location'}
                  </Button>
                  {problem && <span className="text-caption text-error">{problem}</span>}
                </span>
              </Note>
            )}
            <SitterMap className="h-[min(56dvh,460px)]" sitters={sitters ?? []} me={me} selectedId={selected?.id} onSelect={setPicked} />
            {sitters?.length === 0 && (
              <p className="text-label text-medium-grey">No pet sitters have added their area yet. They’ll show up here as they do.</p>
            )}
            {selected && <SitterPostCard {...selected.card} onOpen={() => onOpenSitter(selected.id)} />}
          </>
        )}
      </div>
    </main>
  )
}
