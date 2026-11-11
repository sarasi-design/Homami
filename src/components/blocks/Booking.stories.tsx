import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Check, Handshake, House, Moon, Sun, X } from 'lucide-react'
import { Button } from '../basics/Button'
import { BookingCard } from './BookingCard'
import { CardForm } from './CardForm'
import { ServicePicker } from './ServicePicker'
import { sampleFace } from '../../stories-support/sampleFaces'
import { sampleBookings } from '../../stories-support/sampleBooking'

const meta: Meta = {
  title: 'Blocks/Booking and payments',
  parameters: { options: { showPanel: false } },
  decorators: [(Story) => <div className="w-[361px] bg-surface"><Story /></div>],
}
export default meta

const [asked, mine, paid, exchange, declined] = sampleBookings

/** A sitter's view of a request: Accept charges the owner's card for paid services. */
export const WaitingForYou: StoryObj = {
  name: 'Booking card, waiting for you',
  render: () => (
    <BookingCard
      name="Eva" photoUrl={sampleFace('Eva Miller')} asSitter service={asked.service} startDate={asked.start_date} endDate={asked.end_date}
      quantity={asked.quantity} unitCents={asked.unit_price_cents} totalCents={asked.total_cents} petCount={asked.pet_count} note={asked.note}
      status={asked.status} paymentStatus={asked.payment_status} onOpenPerson={() => {}}
      actions={
        <>
          <Button variant="neutral" size="small" iconLeft={Check}>Accept and get paid</Button>
          <Button variant="ghost" size="small" iconLeft={X}>Decline</Button>
        </>
      }
    />
  ),
}

/** An owner's view, waiting: Cancel request. */
export const YouAsked: StoryObj = {
  name: 'Booking card, you asked',
  render: () => (
    <BookingCard
      name="Daniel" photoUrl={sampleFace('Daniel Medina')} asSitter={false} service={mine.service} startDate={mine.start_date} endDate={mine.end_date}
      quantity={mine.quantity} unitCents={mine.unit_price_cents} totalCents={mine.total_cents} petCount={mine.pet_count}
      status={mine.status} paymentStatus={mine.payment_status}
      actions={<Button variant="ghost" size="small" iconLeft={X}>Cancel request</Button>}
    />
  ),
}

/** Every status: booked and paid, a free exchange, declined, and a payment that didn't go through. */
export const Statuses: StoryObj = {
  name: 'Booking card, every status',
  render: () => (
    <div className="flex flex-col gap-l">
      {[paid, exchange, declined].map((b) => (
        <BookingCard
          key={b.id} name={b.sitter_id === 'me' ? b.owner?.first_name ?? '' : b.sitter?.first_name ?? ''} asSitter={b.sitter_id === 'me'}
          service={b.service} startDate={b.start_date} endDate={b.end_date} quantity={b.quantity} unitCents={b.unit_price_cents}
          totalCents={b.total_cents} petCount={b.pet_count} status={b.status} paymentStatus={b.payment_status}
        />
      ))}
      <BookingCard
        name="Eva" asSitter service="overnight" startDate={asked.start_date} endDate={asked.end_date} quantity={3} unitCents={2500}
        totalCents={7500} petCount={1} status="requested" paymentStatus="failed"
      />
    </div>
  ),
}

function PickerDemo() {
  const [value, setValue] = useState<string | null>('overnight')
  return (
    <ServicePicker
      labelledBy="x"
      value={value}
      onChange={setValue}
      options={[
        { id: 'overnight', icon: Moon, title: 'Overnight stay', description: 'They sleep there every night', price: '25 € / night' },
        { id: 'daily', icon: Sun, title: 'Daily rate', description: 'Daytime care, no overnight', price: '20 € / day' },
        { id: 'stay', icon: House, title: 'Stay in exchange for care', description: 'They stay at your place and care for your pets', price: 'No fees' },
        { id: 'swap', icon: Handshake, title: 'Pet sitting exchange', description: 'You look after their pets next time', price: 'No fees' },
      ]}
    />
  )
}
/** Pick one service: looks like a Service card, chosen like a Choice card (3px Soft sage border). */
export const Services: StoryObj = { name: 'Service picker', render: () => <PickerDemo /> }

/**
 * Stripe's own card fields inside a Homami card. Needs VITE_STRIPE_PUBLISHABLE_KEY and the payments
 * function, so in Storybook it shows the message people see when payments aren't set up yet.
 */
export const AddCard: StoryObj = { name: 'Card form', render: () => <CardForm onSaved={() => {}} onCancel={() => {}} /> }
