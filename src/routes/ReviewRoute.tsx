import { useEffect, useState } from 'react'
import { ReviewSitter } from '../screens/ReviewSitter'
import { getPerson } from '../lib/circle'
import type { PersonProfile } from '../lib/circle'
import { getMyReview, removeReview, saveReview } from '../lib/reviews'
import type { MyReview } from '../lib/reviews'
import type { BookingListing } from '../lib/bookings'
import { go, goBack } from '../lib/router'

/** Loads a pet sitter and your review of them (if any) for the Review screen */
export function ReviewRoute({ me, sitterId, booking, onDone }: { me: string; sitterId: string; booking: BookingListing | null; onDone: () => void }) {
  const [person, setPerson] = useState<PersonProfile | null | undefined>(undefined)
  const [mine, setMine] = useState<MyReview | null | undefined>(undefined)
  useEffect(() => {
    let cancelled = false
    getPerson(sitterId).then((p) => !cancelled && setPerson(p)).catch(() => !cancelled && setPerson(null))
    getMyReview(me, sitterId).then((r) => !cancelled && setMine(r)).catch(() => !cancelled && setMine(null))
    return () => {
      cancelled = true
    }
  }, [me, sitterId])
  if (person === undefined || mine === undefined) return null
  const name = person?.first_name ?? booking?.sitter?.first_name ?? 'this sitter'
  return (
    <ReviewSitter
      sitterName={name}
      sitterPhotoUrl={person?.avatar_url ?? booking?.sitter?.avatar_url}
      booking={booking}
      initial={mine}
      notYet={!booking}
      onSubmit={async (values) => {
        await saveReview(sitterId, values)
        onDone()
      }}
      onRemove={async () => {
        await removeReview(me, sitterId)
        onDone()
      }}
      onHowItWorks={() => go('/help/reviews')}
      onBack={goBack}
    />
  )
}
