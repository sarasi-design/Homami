import type { Meta, StoryObj } from '@storybook/react-vite'
import { BookSitter } from './BookSitter'
import { Bookings } from './Bookings'
import { PaymentDetails } from './PaymentDetails'
import { sampleFace } from '../stories-support/sampleFaces'
import { sampleSitter } from '../stories-support/sampleSitter'
import { ME, sampleBookings } from '../stories-support/sampleBooking'

const meta: Meta = {
  title: 'Screens/Booking and payments',
  parameters: { layout: 'centered', options: { showPanel: false } },
  decorators: [
    (Story) => (
      <div className="relative h-[852px] w-[393px] overflow-y-auto rounded-[20px] border border-soft-grey bg-surface [transform:translateZ(0)] [&>div]:min-h-full [&>main]:min-h-full">
        <Story />
      </div>
    ),
  ],
}
export default meta

const wait = () => new Promise<void>((r) => setTimeout(r, 1200))
const pets = [
  { id: '1', name: 'Berta', kindLabel: 'Dog', ageLabel: '4 years old', photoUrl: sampleFace('Berta', 3) },
  { id: '2', name: 'Sushy', kindLabel: 'Cat', ageLabel: '6 years old' },
]

/** From a sitter's profile ("Book"). Pick a service and dates to see the price. Nothing is charged until they accept. */
export const Book: StoryObj = {
  name: '1. Book a sitter',
  render: () => (
    <BookSitter sitterName="Daniel" sitter={sampleSitter} sitterCanBePaid pets={pets} card="Visa •••• 4242" onAddCard={() => {}} onSubmit={wait} onBack={() => {}} />
  ),
}

const inDays = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** The sitter is available from – to (Sara, Nov 11): only those days can be picked. */
export const BookAvailableWindow: StoryObj = {
  name: '1. Book a sitter available from – to',
  render: () => (
    <BookSitter
      sitterName="Daniel"
      sitter={{ ...sampleSitter, available_from: inDays(5), available_until: inDays(19) }}
      sitterCanBePaid
      pets={pets}
      card="Visa •••• 4242"
      onAddCard={() => {}}
      onSubmit={wait}
      onBack={() => {}}
    />
  ),
}

/** No card yet: paid services ask you to add one first; exchanges still work. */
export const BookNoCard: StoryObj = {
  name: '1. Book a sitter, no card yet',
  render: () => <BookSitter sitterName="Daniel" sitter={sampleSitter} sitterCanBePaid pets={pets} card={null} onAddCard={() => {}} onSubmit={wait} onBack={() => {}} />,
}

/** The sitter hasn't set up payouts: paid services can't be booked through Homami yet. */
export const BookSitterNotPayable: StoryObj = {
  name: '1. Book a sitter who can’t be paid yet',
  render: () => (
    <BookSitter sitterName="Daniel" sitter={sampleSitter} sitterCanBePaid={false} pets={pets} card="Visa •••• 4242" onAddCard={() => {}} onSubmit={wait} onBack={() => {}} />
  ),
}

/** Your bookings: waiting for an answer (Accept / Decline, or Cancel request), coming up, earlier. */
export const YourBookings: StoryObj = {
  name: '2. Your bookings',
  render: () => <Bookings me={ME} bookings={sampleBookings} onAccept={wait} onDecline={wait} onCancel={wait} onOpenPerson={() => {}} onBack={() => {}} />,
}

export const NoBookings: StoryObj = {
  name: '2. Your bookings, none yet',
  render: () => <Bookings me={ME} bookings={[]} onAccept={wait} onDecline={wait} onCancel={wait} onOpenPerson={() => {}} onBack={() => {}} />,
}

const profile = { card_brand: 'visa', card_last4: '4242', card_exp: '12/28', stripe_account_id: 'acct_1', payouts_ready: true }

/** Payment details for a sitter with a card and payouts ready. */
export const Payments: StoryObj = {
  name: '3. Payment details',
  render: () => (
    <PaymentDetails profile={profile} isSitter configured onCardSaved={() => {}} onRemoveCard={wait} onSetUpPayouts={wait} onBack={() => {}} />
  ),
}

/** Nothing set up yet: Add a card, and Set up payouts for sitters. */
export const PaymentsEmpty: StoryObj = {
  name: '3. Payment details, nothing yet',
  render: () => <PaymentDetails profile={null} isSitter configured onCardSaved={() => {}} onRemoveCard={wait} onSetUpPayouts={wait} onBack={() => {}} />,
}

/** Payouts started on Stripe but not finished. */
export const PaymentsPayoutsUnfinished: StoryObj = {
  name: '3. Payment details, payouts not finished',
  render: () => (
    <PaymentDetails
      profile={{ ...profile, payouts_ready: false }}
      isSitter
      configured
      onCardSaved={() => {}}
      onRemoveCard={wait}
      onSetUpPayouts={wait}
      onBack={() => {}}
    />
  ),
}

/** Before the Stripe key is in .env. */
export const PaymentsNotConfigured: StoryObj = {
  name: '3. Payment details, payments not set up',
  render: () => <PaymentDetails profile={null} isSitter configured={false} onCardSaved={() => {}} onRemoveCard={wait} onSetUpPayouts={wait} onBack={() => {}} />,
}
