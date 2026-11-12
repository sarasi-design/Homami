import { TextLink } from '../components/basics/TextLink'
import { BookingItem } from '../components/blocks/BookingItem'
import { EmptyState } from '../components/blocks/EmptyState'
import { Header } from '../components/blocks/Header'
import { FormError } from './WelcomeLayout'
import { todayIso } from '../lib/bookings'
import type { BookingListing } from '../lib/bookings'

/**
 * Your bookings — from Your profile. Every booking you asked for and every one you were asked for,
 * in three groups:
 *   Waiting for an answer   sitters: Accept (charges the owner's card for paid services) / Decline
 *                           owners: Cancel request
 *   Coming up               accepted, not over yet
 *   Earlier                 over, declined or cancelled
 * Accepted bookings can be cancelled (Cancel booking → the cancel screen; Sara, Nov 12), with a link to
 * Find out more → Cancelling a booking under the list.
 */
export interface BookingsProps {
  me: string
  /** undefined while loading */
  bookings: BookingListing[] | undefined
  loadError?: string | null
  onAccept: (b: BookingListing) => Promise<void>
  onDecline: (b: BookingListing) => Promise<void>
  onCancel: (b: BookingListing) => Promise<void>
  onCancelBooking?: (b: BookingListing) => void
  onHelp?: () => void
  onOpenPerson: (id: string) => void
  onBack: () => void
}

export function Bookings({ me, bookings, loadError, onAccept, onDecline, onCancel, onCancelBooking, onHelp, onOpenPerson, onBack }: BookingsProps) {
  const list = bookings ?? []
  const waiting = list.filter((b) => b.status === 'requested' && b.end_date >= todayIso())
  const coming = list.filter((b) => b.status === 'accepted' && b.end_date >= todayIso())
  const earlier = list.filter((b) => !waiting.includes(b) && !coming.includes(b)).reverse()

  const card = (b: BookingListing) => (
    <li key={b.id}>
      <BookingItem me={me} booking={b} onAccept={onAccept} onDecline={onDecline} onCancel={onCancel} onCancelBooking={onCancelBooking} onOpenPerson={onOpenPerson} />
    </li>
  )

  const group = (title: string, items: BookingListing[]) =>
    items.length > 0 && (
      <section className="flex flex-col gap-m">
        <h2 className="text-body text-dark-grey">{title}</h2>
        <ul className="flex flex-col gap-l">{items.map(card)}</ul>
      </section>
    )

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
      <Header title="Your bookings" onBack={onBack} />
      <div className="flex flex-1 flex-col gap-xl px-l pt-s pb-[40px]">
        {loadError ? (
          <FormError>{loadError}</FormError>
        ) : bookings === undefined ? null : list.length === 0 ? (
          <EmptyState title="No bookings yet">Book a pet sitter from their profile. Bookings people ask you for show up here too.</EmptyState>
        ) : (
          <>
            {group('Waiting for an answer', waiting)}
            {group('Coming up', coming)}
            {group('Earlier', earlier)}
            {onHelp && (
              <p className="text-label text-medium-grey">
                Plans changed?{' '}
                <TextLink onClick={onHelp} className="min-h-0">
                  How cancelling and refunds work
                </TextLink>
              </p>
            )}
          </>
        )}
      </div>
    </main>
  )
}
