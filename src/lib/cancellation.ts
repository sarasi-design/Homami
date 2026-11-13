import { supabase } from './supabase'
import { databaseError, needsUpdate } from './errors'
import { callPayments } from './payments'
import { SERVICES, todayIso } from './bookings'
import type { Booking } from './bookings'
import { dateRangeLabel } from './requests'
import { euros } from './sitters'

/**
 * Cancelling a booking (database script 15 + the payments function; Sara, Nov 12, 2026).
 *   Who      the pet owner or the sitter, once it's accepted, up to and including its first day
 *   Why      a reason from a short list, and a message if they like; it goes to the other person's chat
 *   Refund   the owner cancels 14+ days before → 100% · 7–13 days → 50% · less than 7 → 20%
 *            the sitter cancels → 100% back to the owner
 * The payments function has the same rules and is the one that counts; here they're shown beforehand.
 * Also written up for people on Find out more → Cancelling a booking (src/lib/help.ts).
 */
export type CancelReason =
  | 'plans_changed'
  | 'pet_unwell'
  | 'other_care'
  | 'cant_make_it'
  | 'feeling_unwell'
  | 'emergency'
  | 'something_else'

export const CANCEL_REASONS: Record<CancelReason, string> = {
  plans_changed: 'My plans changed',
  pet_unwell: 'My pet is unwell',
  other_care: 'I found other care',
  cant_make_it: 'I can’t make it any more',
  feeling_unwell: 'I’m not feeling well',
  emergency: 'Something urgent came up',
  something_else: 'Something else',
}

export const OWNER_REASONS: CancelReason[] = ['plans_changed', 'pet_unwell', 'other_care', 'something_else']
export const SITTER_REASONS: CancelReason[] = ['cant_make_it', 'feeling_unwell', 'emergency', 'something_else']

/** The rules, in order, for the cancel screen and Find out more */
export const REFUND_TIERS = [
  { id: 'full', percent: 100, when: '14 days or more before' },
  { id: 'half', percent: 50, when: '7 to 13 days before' },
  { id: 'late', percent: 20, when: 'Less than 7 days before' },
] as const

const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00`) - Date.parse(`${a}T12:00:00`)) / 86400000)

export interface Refund {
  /** 0–100 */
  percent: number
  cents: number
  /** Which rule applies; 'sitter' when the sitter cancels */
  tier: (typeof REFUND_TIERS)[number]['id'] | 'sitter' | 'free'
  daysBefore: number
}

/** How much goes back to the owner if `me` cancels today */
export function refundIfCancelled(b: Pick<Booking, 'sitter_id' | 'start_date' | 'total_cents' | 'payment_status'>, me: string, today = todayIso()): Refund {
  const daysBefore = daysBetween(today, b.start_date)
  if (b.total_cents === 0 || b.payment_status !== 'paid') return { percent: 0, cents: 0, tier: 'free', daysBefore }
  const percent = b.sitter_id === me ? 100 : daysBefore >= 14 ? 100 : daysBefore >= 7 ? 50 : 20
  const tier = b.sitter_id === me ? 'sitter' : percent === 100 ? 'full' : percent === 50 ? 'half' : 'late'
  return { percent, cents: Math.round((b.total_cents * percent) / 100), tier, daysBefore }
}

/** Accepted bookings can be cancelled up to and including their first day */
export const canCancel = (b: Pick<Booking, 'status' | 'start_date'>, today = todayIso()) => b.status === 'accepted' && b.start_date >= today

/** The chat message sent to the other person, so they hear it straight away */
export function cancellationMessage(b: Pick<Booking, 'service' | 'start_date' | 'end_date' | 'sitter_id'>, me: string, reason: CancelReason, note: string, refundCents: number) {
  const what = `${SERVICES[b.service].label.toLowerCase()}, ${dateRangeLabel(b.start_date, b.end_date)}`
  const why = reason === 'something_else' && note ? '' : ` ${CANCEL_REASONS[reason]}.`
  const money = refundCents > 0 ? (b.sitter_id === me ? ` You’ll get all ${euros(refundCents / 100)} back.` : ` I’ll get ${euros(refundCents / 100)} back.`) : ''
  return `Sorry, I’ve had to cancel our booking: ${what}.${why}${note ? ` ${note}` : ''}${money}`
}

const cancellingNeedsUpdate = needsUpdate('cancelling', 'script 15')

/** Paid bookings are refunded by the payments function; everything else is cancelled by the database */
export async function cancelWithReason(b: Pick<Booking, 'id' | 'status' | 'payment_status'>, reason: CancelReason, note: string): Promise<Booking> {
  if (b.status === 'accepted' && b.payment_status === 'paid') {
    const { booking } = await callPayments<{ booking: Booking }>('cancel-booking', { bookingId: b.id, reason, note: note.trim() })
    return booking
  }
  const { data, error } = await supabase.rpc('cancel_booking_with_reason', { booking: b.id, reason, note: note.trim() })
  if (error) {
    console.error('Cancelling failed', error)
    throw databaseError(error, cancellingNeedsUpdate)
  }
  return data as Booking
}
