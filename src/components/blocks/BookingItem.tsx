import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '../basics/Button'
import { BookingCard } from './BookingCard'
import { ConfirmAction } from './ConfirmAction'
import { todayIso } from '../../lib/bookings'
import type { BookingListing } from '../../lib/bookings'

/**
 * BookingItem — a BookingCard with what you can do about it, used on Your bookings and inside a chat
 * (Sara, Nov 11: "a booking request in the chat that you can accept from there").
 *   Waiting for an answer   sitters: Accept (charges the owner's card for paid services) / Decline
 *                           owners: Cancel request
 *   Anything else           just the card and its status
 * Shows its own "Accepting…" and any error under the card.
 */
export interface BookingItemProps {
  me: string
  booking: BookingListing
  onAccept: (b: BookingListing) => Promise<void>
  onDecline: (b: BookingListing) => Promise<void>
  onCancel: (b: BookingListing) => Promise<void>
  onOpenPerson?: (id: string) => void
}

export function BookingItem({ me, booking: b, onAccept, onDecline, onCancel, onOpenPerson }: BookingItemProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = (fn: (b: BookingListing) => Promise<void>) => async () => {
    setBusy(true)
    setError(null)
    try {
      await fn(b)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const asSitter = b.sitter_id === me
  const other = asSitter ? b.owner : b.sitter
  const open = b.status === 'requested' && b.end_date >= todayIso()

  return (
    <div className="flex flex-col gap-s">
      <BookingCard
        name={other?.first_name ?? 'Homami member'}
        photoUrl={other?.avatar_url}
        asSitter={asSitter}
        service={b.service}
        startDate={b.start_date}
        endDate={b.end_date}
        quantity={b.quantity}
        unitCents={b.unit_price_cents}
        totalCents={b.total_cents}
        petCount={b.pet_count}
        note={b.note}
        status={b.status}
        paymentStatus={b.payment_status}
        onOpenPerson={onOpenPerson && (() => onOpenPerson(asSitter ? b.owner_id : b.sitter_id))}
        actions={
          open ? (
            asSitter ? (
              <>
                <Button variant="neutral" size="small" iconLeft={Check} onClick={run(onAccept)} disabled={busy} aria-busy={busy || undefined}>
                  {busy ? 'Accepting…' : b.total_cents > 0 ? 'Accept and get paid' : 'Accept'}
                </Button>
                <ConfirmAction size="small" icon={X} label="Decline" confirmLabel="Yes, decline" busyLabel="Declining…" onConfirm={run(onDecline)} />
              </>
            ) : (
              <ConfirmAction size="small" icon={X} label="Cancel request" confirmLabel="Yes, cancel" busyLabel="Cancelling…" onConfirm={run(onCancel)} />
            )
          ) : undefined
        }
      />
      {error && (
        <p role="alert" className="text-label text-error">
          {error}
        </p>
      )}
    </div>
  )
}
