import { useEffect, useState } from 'react'
import { BookSitter } from '../screens/BookSitter'
import { PersonPage } from '../screens/CircleScreens'
import type { PetSummary } from '../components/blocks/PetsSection'
import { getPerson } from '../lib/circle'
import type { PersonProfile } from '../lib/circle'
import { getSitterProfile } from '../lib/sitters'
import type { SitterProfile } from '../lib/sitters'
import { canBePaid } from '../lib/payments'
import { bookingRequestMessage, requestBooking } from '../lib/bookings'
import { sendMessage } from '../lib/chat'
import { go, goBack } from '../lib/router'

/** Loads a pet sitter (their prices and whether they can be paid) for the Book screen */
export function BookRoute({ me, sitterId, pets, card, onAddCard, onBooked }: { me: string; sitterId: string; pets: PetSummary[]; card: string | null; onAddCard: () => void; onBooked: () => void }) {
  const [person, setPerson] = useState<PersonProfile | null | undefined>(undefined)
  const [sitter, setSitter] = useState<SitterProfile | null | undefined>(undefined)
  const [payable, setPayable] = useState(false)
  useEffect(() => {
    let cancelled = false
    getPerson(sitterId).then((p) => !cancelled && setPerson(p)).catch(() => !cancelled && setPerson(null))
    getSitterProfile(sitterId).then((s) => !cancelled && setSitter(s)).catch(() => !cancelled && setSitter(null))
    canBePaid(sitterId).then((ok) => !cancelled && setPayable(ok))
    return () => {
      cancelled = true
    }
  }, [sitterId])
  if (person === undefined || sitter === undefined) return null
  if (!person || !sitter) {
    return (
      <PersonPage person={null} pets={null} onBack={goBack} />
    )
  }
  return (
    <BookSitter
      sitterName={person.first_name ?? 'this sitter'}
      sitter={sitter}
      sitterCanBePaid={payable}
      pets={pets}
      card={card}
      onAddCard={onAddCard}
      onHowCancellingWorks={() => go('/help/cancelling')}
      onSubmit={async (values) => {
        await requestBooking(sitterId, values)
        // Tell the sitter in your chat: Chats gets a badge, and the request shows there with Accept / Decline.
        // The booking is already made, so a message that doesn't send never undoes it.
        await sendMessage(me, sitterId, bookingRequestMessage(person.first_name ?? 'there', values)).catch((err) =>
          console.warn('The booking message didn’t send', err),
        )
        onBooked()
      }}
      onBack={goBack}
    />
  )
}
