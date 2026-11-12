import { useState } from 'react'
import { CalendarDays, CreditCard, Footprints, Handshake, House, Moon, Send, Sun } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '../components/basics/Button'
import { DetailRow } from '../components/basics/DetailRow'
import { Note } from '../components/basics/Note'
import { TextLink } from '../components/basics/TextLink'
import { TextArea, TextInput } from '../components/basics/TextInput'
import { Header } from '../components/blocks/Header'
import { MonthCalendar } from '../components/blocks/MonthCalendar'
import { PetPicker } from '../components/blocks/PetPicker'
import { ServicePicker } from '../components/blocks/ServicePicker'
import type { PetSummary } from '../components/blocks/PetsSection'
import { FormError } from './WelcomeLayout'
import { SERVICES, bookableServices, priceFor, priceLine, todayIso, totalLabel } from '../lib/bookings'
import type { BookingValues, ServiceId } from '../lib/bookings'
import { dateRangeLabel } from '../lib/requests'
import { availabilityLabel, euros } from '../lib/sitters'
import type { SitterProfile } from '../lib/sitters'

/**
 * Book a pet sitter — from their profile ("Book", next to Message). Figma "Chat+book" (140:6880) has the
 * flow but no screens, so it's built like Create a request, on one page:
 *   Service (the sitter's priced services and free exchanges, pick one) · When (from the day the sitter is
 *   available; earlier days can't be picked, Sara Nov 11) · Hours (walks only) ·
 *   Which pets · A note for the sitter · Price (the same sum the database does) · How you pay
 * "Send booking request": nothing is charged until the sitter accepts. Paid services need a card on file
 * (link to Payment details) and the sitter set up to be paid; otherwise it says so plainly.
 */
export interface BookSitterProps {
  sitterName: string
  sitter: Omit<SitterProfile, 'user_id'>
  /** Can this sitter be paid through Homami? (Stripe payouts set up) */
  sitterCanBePaid: boolean
  pets: PetSummary[]
  /** "Visa •••• 4242", or null with no card yet */
  card: string | null
  onAddCard: () => void
  onSubmit: (values: BookingValues) => Promise<void>
  /** Find out more → Cancelling a booking, linked under the price of paid services */
  onHowCancellingWorks?: () => void
  onBack: () => void
}

const ICONS: Record<ServiceId, LucideIcon> = { overnight: Moon, daily: Sun, walk: Footprints, stay_for_care: House, sitting_exchange: Handshake }
const DESCRIPTIONS: Record<ServiceId, string> = {
  overnight: 'They sleep there every night',
  daily: 'Daytime care, no overnight',
  walk: 'Walks or home visits, by the hour',
  stay_for_care: 'They stay at your place and care for your pets',
  sitting_exchange: 'You look after their pets next time',
}

export function BookSitter({ sitterName, sitter, sitterCanBePaid, pets, card, onAddCard, onSubmit, onHowCancellingWorks, onBack }: BookSitterProps) {
  const services = bookableServices(sitter)
  const [service, setService] = useState<ServiceId | null>(services.length === 1 ? services[0].id : null)
  const [start, setStart] = useState<string | null>(null)
  const [end, setEnd] = useState<string | null>(null)
  const [hours, setHours] = useState('1')
  const [petIds, setPetIds] = useState<string[]>(pets.length === 1 ? [pets[0].id] : [])
  const [note, setNote] = useState('')
  const [triedOnce, setTriedOnce] = useState(false)
  const [sending, setSending] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Bookings fit in the days the sitter is available (from – to)
  const limited = (!!sitter.available_from && sitter.available_from > todayIso()) || !!sitter.available_until
  const notAvailable = !!sitter.available_until && sitter.available_until < todayIso()
  const chosen = services.find((s) => s.id === service)
  const paid = !!chosen && chosen.rate > 0
  const hoursNumber = Number(hours)
  const hoursError = service === 'walk' && (!Number.isInteger(hoursNumber) || hoursNumber < 1 || hoursNumber > 40) ? 'Use a number from 1 to 40' : undefined
  const price = chosen && start ? priceFor(chosen.id, chosen.rate, start, end ?? start, hoursNumber || 1) : null
  const blocked = paid && (!card || !sitterCanBePaid)

  const errors = {
    service: triedOnce && !service ? 'Pick a service' : undefined,
    dates: triedOnce && !start ? 'Pick the first day' : undefined,
    pets: triedOnce && pets.length > 0 && petIds.length === 0 ? 'Pick at least one pet' : undefined,
  }

  async function send() {
    setTriedOnce(true)
    if (!service || !start || hoursError || (pets.length > 0 && petIds.length === 0)) {
      const id = !service ? 'book-service' : !start ? 'book-when' : hoursError ? 'book-hours' : 'book-pets'
      return document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    if (blocked) return
    setSending(true)
    setFormError(null)
    try {
      await onSubmit({ service, start_date: start, end_date: end ?? start, hours: hoursNumber || 1, pet_ids: petIds, note: note.trim() })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (services.length === 0) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
        <Header title={`Book ${sitterName}`} onBack={onBack} />
        <div className="px-l pt-s">
          <Note title={`${sitterName} hasn’t set any prices yet`}>Send them a message to agree on what you need.</Note>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
      <Header title={`Book ${sitterName}`} onBack={onBack} />
      <div className="flex flex-1 flex-col gap-xl px-l pt-s pb-[40px]">
        <section id="book-service" className="flex flex-col gap-m">
          <h2 id="book-service-title" className="text-overline text-dark-grey">
            Service
          </h2>
          <ServicePicker
            labelledBy="book-service-title"
            value={service}
            onChange={(id) => setService(id as ServiceId)}
            options={services.map((s) => ({
              id: s.id,
              icon: ICONS[s.id],
              title: SERVICES[s.id].label,
              description: DESCRIPTIONS[s.id],
              price: s.rate > 0 ? `${euros(s.rate)} / ${SERVICES[s.id].unit}` : 'No fees',
            }))}
          />
          {errors.service && (
            <p role="alert" className="text-label text-error">
              {errors.service}
            </p>
          )}
        </section>

        <section id="book-when" className="flex flex-col gap-m">
          <h2 className="text-overline text-dark-grey">When</h2>
          {notAvailable ? (
            <Note title={`${sitterName} isn’t available right now`}>Send them a message to ask when they’re free again.</Note>
          ) : (
            limited && (
              <p className="text-label text-dark-grey">
                {sitterName} is {availabilityLabel(sitter.available_from, sitter.available_until ?? null).replace(/^Available/, 'available')}. You can pick days in that time.
              </p>
            )
          )}
          <MonthCalendar
            mode="range"
            label="When you need them"
            minDate={sitter.available_from}
            maxDate={sitter.available_until}
            start={start}
            end={end}
            onRangeChange={(s, e) => {
              setStart(s)
              setEnd(e)
            }}
          />
          <p className="text-caption text-medium-grey" aria-live="polite">
            {start ? `${dateRangeLabel(start, end ?? start)}${end ? '' : ' · tap a later day to make it longer'}` : 'Tap the first day, then the last one.'}
          </p>
          {errors.dates && (
            <p role="alert" className="text-label text-error">
              {errors.dates}
            </p>
          )}
        </section>

        {service === 'walk' && (
          <section className="flex flex-col gap-m">
            <h2 className="text-overline text-dark-grey">How many hours</h2>
            <TextInput
              id="book-hours"
              label="How many hours in total"
              hideLabel
              inputMode="numeric"
              suffix="hours"
              helper="In total, across all the days"
              value={hours}
              onChange={(e) => setHours(e.target.value.replace(/[^\d]/g, ''))}
              error={hoursError}
            />
          </section>
        )}

        {pets.length > 0 && (
          <section id="book-pets" className="flex flex-col gap-m">
            <h2 className="text-overline text-dark-grey">Which pets</h2>
            <PetPicker multiple label="Which pets" pets={pets} values={petIds} onChangeMany={setPetIds} />
            {errors.pets && (
              <p role="alert" className="text-label text-error">
                {errors.pets}
              </p>
            )}
          </section>
        )}

        <section className="flex flex-col gap-m">
          <h2 className="text-overline text-dark-grey">A note for {sitterName}</h2>
          <TextArea
            label={`A note for ${sitterName}`}
            hideLabel
            placeholder="Anything they should know: routines, keys, the vet…"
            maxLength={500}
            showCount
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </section>

        {price && chosen && (
          <section className="flex flex-col gap-m rounded-card border border-soft-grey p-l" aria-live="polite">
            <h2 className="text-overline text-dark-grey">Price</h2>
            <DetailRow icon={CalendarDays}>{priceLine(chosen.id, price.quantity, price.unitCents)}</DetailRow>
            <div className="flex items-center justify-between border-t border-light-grey pt-m">
              <span className="text-body text-dark-grey">Total</span>
              <span className="text-body-bold text-dark-grey">{totalLabel(price.totalCents)}</span>
            </div>
            {paid && card && (
              <DetailRow icon={CreditCard}>
                Paid with <strong>{card}</strong>, only when {sitterName} accepts
              </DetailRow>
            )}
            {paid && (
              <p className="text-caption text-medium-grey">
                Cancel 14 days or more before and you get everything back.{' '}
                {onHowCancellingWorks && (
                  <TextLink onClick={onHowCancellingWorks} className="min-h-0 text-caption">
                    How cancelling works
                  </TextLink>
                )}
              </p>
            )}
          </section>
        )}

        {paid && !sitterCanBePaid && (
          <Note title={`${sitterName} can’t be paid through Homami yet`}>
            Send them a message, or pick one of their exchange options if they offer one.
          </Note>
        )}
        {paid && sitterCanBePaid && !card && (
          <Note title="Add a card to book paid services">
            You’re only charged when {sitterName} accepts.{' '}
            <button type="button" onClick={onAddCard} className="cursor-pointer font-semibold text-dark-sage underline underline-offset-2">
              Add a card
            </button>
          </Note>
        )}

        {formError && <FormError>{formError}</FormError>}

        <div className="mt-auto flex flex-col items-center gap-m pt-xl">
          <Button variant="neutral" iconRight={Send} onClick={send} disabled={sending || blocked} aria-busy={sending || undefined}>
            {sending ? 'Sending…' : 'Send booking request'}
          </Button>
          <p className="text-center text-caption text-medium-grey">{sitterName} will accept or decline. Nothing is charged until they accept.</p>
        </div>
      </div>
    </main>
  )
}
