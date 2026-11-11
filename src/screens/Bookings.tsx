import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '../components/basics/Button'
import { Note } from '../components/basics/Note'
import { BookingCard } from '../components/blocks/BookingCard'
import { ConfirmAction } from '../components/blocks/ConfirmAction'
import { EmptyState } from '../components/blocks/EmptyState'
import { Header } from '../components/blocks/Header'
import { FormError } from './WelcomeLayout'
import type { BookingListing } from '../lib/bookings'

/**
 * Your bookings — from Your profile. Every booking you asked for and every one you were asked for,
 * in three groups:
 *   Waiting for an answer   sitters: Accept (charges the owner's card for paid services) / Decline
 *                           owners: Cancel request
 *   Coming up               accepted, not over yet
 *   Earlier                 over, declined or cancelled
 * Once accepted and paid, changes and refunds aren't in the app yet: people message each other.
 */
export interface BookingsProps {
  me: string
  /** undefined while loading */
  bookings: BookingListing[] | undefined
  loadError?: string | null
  onAccept: (b: BookingListing) => Promise<void>
  onDecline: (b: BookingListing) => Promise<void>
  onCancel: (b: BookingListing) => Promise<void>
  onOpenPerson: (id: string) => void
  onBack: () => void
}

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function Bookings({ me, bookings, loadError, onAccept, onDecline, onCancel, onOpenPerson, onBack }: BookingsProps) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<{ id: string; message: string } | null>(null)

  const run = (b: BookingListing, fn: (b: BookingListing) => Promise<void>) => async () => {
    setBusyId(b.id)
    setError(null)
    try {
      await fn(b)
    } catch (err) {
      setError({ id: b.id, message: err instanceof Error ? err.message : 'Something went wrong. Please try again.' })
    } finally {
      setBusyId(null)
    }
  }

  const list = bookings ?? []
  const waiting = list.filter((b) => b.status === 'requested' && b.end_date >= today())
  const coming = list.filter((b) => b.status === 'accepted' && b.end_date >= today())
  const earlier = list.filter((b) => !waiting.includes(b) && !coming.includes(b)).reverse()

  const card = (b: BookingListing) => {
    const asSitter = b.sitter_id === me
    const other = asSitter ? b.owner : b.sitter
    const busy = busyId === b.id
    const open = b.status === 'requested' && b.end_date >= today()
    return (
      <li key={b.id} className="flex flex-col gap-s">
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
          onOpenPerson={() => onOpenPerson(asSitter ? b.owner_id : b.sitter_id)}
          actions={
            open ? (
              asSitter ? (
                <>
                  <Button variant="neutral" size="small" iconLeft={Check} onClick={run(b, onAccept)} disabled={busy} aria-busy={busy || undefined}>
                    {busy ? 'Accepting…' : b.total_cents > 0 ? 'Accept and get paid' : 'Accept'}
                  </Button>
                  <ConfirmAction size="small" icon={X} label="Decline" confirmLabel="Yes, decline" busyLabel="Declining…" onConfirm={run(b, onDecline)} />
                </>
              ) : (
                <ConfirmAction size="small" icon={X} label="Cancel request" confirmLabel="Yes, cancel" busyLabel="Cancelling…" onConfirm={run(b, onCancel)} />
              )
            ) : undefined
          }
        />
        {error?.id === b.id && <FormError>{error.message}</FormError>}
      </li>
    )
  }

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
            {coming.some((b) => b.payment_status === 'paid') && (
              <Note>Need to change or cancel a paid booking? Send the other person a message for now.</Note>
            )}
          </>
        )}
      </div>
    </main>
  )
}
