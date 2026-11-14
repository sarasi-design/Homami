import { ChatThread } from '../screens/Chat'
import { BookingItem } from '../components/blocks/BookingItem'
import type { BookingItemProps } from '../components/blocks/BookingItem'
import type { BookingListing } from '../lib/bookings'
import { go, goBack } from '../lib/router'
import { useChatThread } from '../hooks/useChatThread'

/** Accept / Decline / Cancel / Review a booking, from Your bookings or from a chat */
export type BookingActions = Pick<BookingItemProps, 'onAccept' | 'onDecline' | 'onCancel' | 'onCancelBooking' | 'onReview' | 'reviewedSitters'>

interface ChatRouteProps {
  me: string
  otherId: string
  inCircle: boolean
  onChanged: () => void
  /** Bookings between you two, shown in the chat as cards (Accept / Decline for the sitter) */
  bookings: BookingListing[]
  bookingActions: BookingActions
  onRefreshBookings: () => void
}

/** One chat, full screen (no bottom nav: the message bar sits at the bottom) */
export function ChatRoute({ me, otherId, inCircle, onChanged, bookings, bookingActions, onRefreshBookings }: ChatRouteProps) {
  const { person, isSitter, messages, error, send, retry } = useChatThread(me, otherId, { onChanged, onRefreshBookings })
  return (
    <ChatThread
      me={me}
      person={person}
      messages={messages}
      // With a pet sitter you don't know yet: tips for meeting before you book
      showBookingTips={isSitter && !inCircle}
      error={error}
      onSend={send}
      onRetry={retry}
      onBack={goBack}
      onOpenProfile={() => go(`/people/${otherId}`)}
      cards={bookings.map((b) => ({ id: `booking-${b.id}`, created_at: b.created_at, content: <BookingItem me={me} booking={b} {...bookingActions} /> }))}
    />
  )
}
