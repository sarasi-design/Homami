import { useEffect, useState } from 'react'
import { RecommendSitter } from '../screens/RecommendSitter'
import { getPerson } from '../lib/circle'
import type { PersonProfile } from '../lib/circle'
import { getSitterProfile } from '../lib/sitters'
import { getMyRecommendation, removeRecommendation, saveRecommendation } from '../lib/recommendations'
import type { MyRecommendation } from '../lib/recommendations'
import type { PetSummary } from '../components/blocks/PetsSection'
import { goBack } from '../lib/router'

/** Loads a pet sitter and your recommendation of them (if any) for Recommend a sitter (database script 20) */
export function RecommendRoute({ me, sitterId, pets, onDone }: { me: string; sitterId: string; pets: PetSummary[]; onDone: () => void }) {
  const [person, setPerson] = useState<PersonProfile | null | undefined>(undefined)
  const [isSitter, setIsSitter] = useState<boolean | undefined>(undefined)
  const [mine, setMine] = useState<MyRecommendation | null | undefined>(undefined)
  useEffect(() => {
    let cancelled = false
    getPerson(sitterId).then((p) => !cancelled && setPerson(p)).catch(() => !cancelled && setPerson(null))
    getSitterProfile(sitterId).then((s) => !cancelled && setIsSitter(!!s)).catch(() => !cancelled && setIsSitter(false))
    getMyRecommendation(me, sitterId).then((r) => !cancelled && setMine(r)).catch(() => !cancelled && setMine(null))
    return () => {
      cancelled = true
    }
  }, [me, sitterId])
  if (person === undefined || isSitter === undefined || mine === undefined) return null
  const name = person?.first_name ?? 'this sitter'
  const unavailable =
    sitterId === me ? 'You can’t recommend yourself. Share your page with your clients instead.' : !isSitter ? `${name} doesn’t offer pet sitting at the moment.` : null
  return (
    <RecommendSitter
      sitterName={name}
      sitterPhotoUrl={person?.avatar_url}
      pets={pets.map((p) => ({ id: p.id, name: p.name, photoUrl: p.photoUrl }))}
      initial={mine}
      unavailable={unavailable}
      onSubmit={async (values) => {
        await saveRecommendation(sitterId, values)
        onDone()
      }}
      onRemove={async () => {
        await removeRecommendation(me, sitterId)
        onDone()
      }}
      onBack={goBack}
    />
  )
}
