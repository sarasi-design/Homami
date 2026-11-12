import { useState } from 'react'
import { CalendarX } from 'lucide-react'
import { Button } from '../components/basics/Button'
import { Note } from '../components/basics/Note'
import { TextArea } from '../components/basics/TextInput'
import { TextLink } from '../components/basics/TextLink'
import { BookingCard } from '../components/blocks/BookingCard'
import { Header } from '../components/blocks/Header'
import { RefundSummary } from '../components/blocks/RefundSummary'
import { ServicePicker } from '../components/blocks/ServicePicker'
import { FormError } from './WelcomeLayout'
import type { BookingListing } from '../lib/bookings'
import { CANCEL_REASONS, OWNER_REASONS, SITTER_REASONS, canCancel, refundIfCancelled } from '../lib/cancellation'
import type { CancelReason } from '../lib/cancellation'

/**
 * Cancel a booking — from "Cancel booking" on a booking card (Your bookings or the chat). Sara, Nov 12, 2026;
 * not in Figma yet, built on one page like Book a sitter:
 *   the booking (BookingCard) · Why are you cancelling? (pick one; required) · A message for them (optional) ·
 *   What happens to the money (paid bookings: RefundSummary with the 100% / 50% / 20% rules) ·
 *   "Cancel booking" and "Keep booking".
 * The other person gets the reason in your chat. A link goes to Find out more → Cancelling a booking.
 */
export interface CancelBookingProps {
  me: string
  booking: BookingListing
  onSubmit: (reason: CancelReason, note: string) => Promise<void>
  onHowItWorks: () => void
  onBack: () => void
  /** Fixed "today" for stories */
  today?: string
}

export function CancelBooking({ me, booking: b, onSubmit, onHowItWorks, onBack, today }: CancelBookingProps) {
  const [reason, setReason] = useState<CancelReason | null>(null)
  const [note, setNote] = useState('')
  const [triedOnce, setTriedOnce] = useState(false)
  const [sending, setSending] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const asSitter = b.sitter_id === me
  const other = (asSitter ? b.owner : b.sitter)?.first_name ?? 'them'
  const refund = refundIfCancelled(b, me, today)
  const paid = refund.tier !== 'free'
  const needsNote = reason === 'something_else' && !note.trim()
  const errors = {
    reason: triedOnce && !reason ? 'Pick a reason' : undefined,
    note: triedOnce && needsNote ? `Tell ${other} a little about why` : undefined,
  }

  async function send() {
    setTriedOnce(true)
    if (!reason || needsNote) return document.getElementById(!reason ? 'cancel-why' : 'cancel-note')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setSending(true)
    setFormError(null)
    try {
      await onSubmit(reason, note.trim())
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setSending(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
      <Header title="Cancel booking" onBack={onBack} />
      <div className="flex flex-1 flex-col gap-xl px-l pt-s pb-[40px]">
        <BookingCard
          name={other}
          photoUrl={(asSitter ? b.owner : b.sitter)?.avatar_url}
          asSitter={asSitter}
          service={b.service}
          startDate={b.start_date}
          endDate={b.end_date}
          quantity={b.quantity}
          unitCents={b.unit_price_cents}
          totalCents={b.total_cents}
          petCount={b.pet_count}
          status={b.status}
          paymentStatus={b.payment_status}
        />

        {!canCancel(b, today) ? (
          <Note title={b.status === 'accepted' ? 'This booking has already started' : 'This booking can’t be cancelled here'}>
            Send {other} a message to sort it out together.
          </Note>
        ) : (
          <>
            <section id="cancel-why" className="flex flex-col gap-m">
              <h2 id="cancel-why-title" className="text-overline text-dark-grey">
                Why are you cancelling?
              </h2>
              <ServicePicker
                labelledBy="cancel-why-title"
                value={reason}
                onChange={(id) => setReason(id as CancelReason)}
                options={(asSitter ? SITTER_REASONS : OWNER_REASONS).map((id) => ({ id, title: CANCEL_REASONS[id] }))}
              />
              {errors.reason && (
                <p role="alert" className="text-label text-error">
                  {errors.reason}
                </p>
              )}
            </section>

            <section className="flex flex-col gap-m">
              <h2 className="text-overline text-dark-grey">A message for {other}</h2>
              <TextArea
                id="cancel-note"
                label={`A message for ${other}`}
                hideLabel
                placeholder={reason === 'something_else' ? 'What happened?' : 'Optional'}
                helper={`${other} gets it in your chat, with the reason.`}
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                error={errors.note}
              />
            </section>

            {paid && (
              <section className="flex flex-col gap-m">
                <h2 className="text-overline text-dark-grey">Your money</h2>
                <RefundSummary refund={refund} totalCents={b.total_cents} ownerName={other} asSitter={asSitter} />
              </section>
            )}

            <p className="text-label text-medium-grey">
              Cancelling can’t be undone.{' '}
              <TextLink onClick={onHowItWorks} className="min-h-0">
                How cancelling works
              </TextLink>
            </p>

            {formError && <FormError>{formError}</FormError>}

            <div className="flex flex-col gap-s">
              <Button variant="neutral" fullWidth iconLeft={CalendarX} onClick={send} disabled={sending} aria-busy={sending || undefined}>
                {sending ? 'Cancelling…' : paid && !asSitter ? `Cancel and get ${refund.percent}% back` : 'Cancel booking'}
              </Button>
              <Button variant="ghost" fullWidth onClick={onBack} disabled={sending}>
                Keep booking
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
