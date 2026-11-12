import { supabase } from './supabase'
import { dateRangeLabel } from './requests'
import { callPayments } from './payments'
import { euros } from './sitters'
import type { SitterProfile } from './sitters'

/**
 * Bookings (database script 11). A pet owner asks a sitter; the sitter accepts or declines.
 * The price is worked out by the database from the sitter's prices; the app shows the same sum
 * beforehand (priceFor) so there are no surprises. Paid bookings are charged when the sitter accepts.
 */
export type ServiceId = 'daily' | 'overnight' | 'walk' | 'stay_for_care' | 'sitting_exchange'
export type BookingStatus = 'requested' | 'accepted' | 'declined' | 'cancelled'
export type PaymentStatus = 'none' | 'paid' | 'failed' | 'refunded' | 'partly_refunded'

export interface Booking {
  id: string
  owner_id: string
  sitter_id: string
  service: ServiceId
  start_date: string
  end_date: string
  quantity: number
  pet_ids: string[]
  pet_count: number
  note: string | null
  unit_price_cents: number
  total_cents: number
  status: BookingStatus
  payment_status: PaymentStatus
  created_at: string
  /** Cancelling (database script 15); missing before it's run */
  cancelled_by?: string | null
  cancel_reason?: string | null
  cancel_note?: string | null
  refund_cents?: number
}

export interface BookingListing extends Booking {
  owner: { first_name: string | null; avatar_url: string | null } | null
  sitter: { first_name: string | null; avatar_url: string | null } | null
}

export interface BookingValues {
  service: ServiceId
  start_date: string
  end_date: string
  hours: number
  pet_ids: string[]
  note: string
}

export const SERVICES: Record<ServiceId, { label: string; unit: string; units: string; free: boolean }> = {
  daily: { label: 'Daily rate', unit: 'day', units: 'days', free: false },
  overnight: { label: 'Overnight stay', unit: 'night', units: 'nights', free: false },
  walk: { label: 'Dog walking', unit: 'hour', units: 'hours', free: false },
  stay_for_care: { label: 'Stay in exchange for care', unit: 'day', units: 'days', free: true },
  sitting_exchange: { label: 'Pet sitting exchange', unit: 'day', units: 'days', free: true },
}

const offline = 'We couldn’t reach Homami. Check your connection and try again.'
const needsUpdate = 'Homami’s database needs an update for bookings and payments (setup script 11). Please try again later.'
const missing = (error: { code?: string; message?: string }) =>
  error.code === '42P01' || error.code === 'PGRST205' || error.code === 'PGRST202' || /relation|schema cache|Could not find the function/i.test(error.message ?? '')
/** The database's own messages ("Add a card in Payment details first.") are written for people: pass them on */
const fromDatabase = (error: { code?: string; message?: string }) =>
  missing(error) ? needsUpdate : error.code === 'P0001' && error.message ? error.message : offline

const baseColumns =
  'id, owner_id, sitter_id, service, start_date, end_date, quantity, pet_ids, pet_count, note, unit_price_cents, total_cents, status, payment_status, created_at'
const columns = `${baseColumns}, cancelled_by, cancel_reason, cancel_note, refund_cents`
/** Before script 15 the cancelling columns aren't there yet: load bookings without them */
const cancelColumnsMissing = (error: { code?: string; message?: string }) =>
  (error.code === '42703' || error.code === 'PGRST204') && /cancel|refund/i.test(error.message ?? '')

/** What this sitter offers that can be booked: priced services and free exchanges */
export function bookableServices(s: Pick<SitterProfile, 'daily_rate' | 'overnight_rate' | 'walk_rate' | 'stay_for_care' | 'sitting_exchange'>) {
  const list: { id: ServiceId; rate: number }[] = []
  if (s.overnight_rate !== null) list.push({ id: 'overnight', rate: s.overnight_rate })
  if (s.daily_rate !== null) list.push({ id: 'daily', rate: s.daily_rate })
  if (s.walk_rate !== null) list.push({ id: 'walk', rate: s.walk_rate })
  if (s.stay_for_care) list.push({ id: 'stay_for_care', rate: 0 })
  if (s.sitting_exchange) list.push({ id: 'sitting_exchange', rate: 0 })
  return list
}

const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00`) - Date.parse(`${a}T12:00:00`)) / 86400000)

/** The same sum the database does: days, nights (at least one) or hours, times the rate */
export function priceFor(service: ServiceId, rate: number, start: string, end: string, hours: number) {
  const quantity = service === 'walk' ? hours : service === 'overnight' ? Math.max(daysBetween(start, end), 1) : daysBetween(start, end) + 1
  return { quantity, unitCents: Math.round(rate * 100), totalCents: Math.round(rate * 100) * quantity }
}

/** "3 nights × 25 € = 75 €", or "4 days · no fees" */
export function priceLine(service: ServiceId, quantity: number, unitCents: number) {
  const s = SERVICES[service]
  const amount = `${quantity} ${quantity === 1 ? s.unit : s.units}`
  if (s.free || unitCents === 0) return `${amount} · no fees`
  return `${amount} × ${euros(unitCents / 100)} = ${euros((unitCents * quantity) / 100)}`
}

export const totalLabel = (cents: number) => (cents === 0 ? 'No fees' : euros(cents / 100))

/** The chat message sent with a booking request, so it shows up in Chats (with a badge) for the sitter */
export function bookingRequestMessage(sitterName: string, v: Pick<BookingValues, 'service' | 'start_date' | 'end_date'>) {
  return `Hi ${sitterName}! I’ve sent you a booking request: ${SERVICES[v.service].label.toLowerCase()}, ${dateRangeLabel(v.start_date, v.end_date)}. You can accept it here in our chat.`
}

/** Today as "2026-11-11", in the person's own time zone */
export const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function requestBooking(sitterId: string, v: BookingValues): Promise<Booking> {
  const { data, error } = await supabase.rpc('request_booking', {
    p_sitter: sitterId,
    p_service: v.service,
    p_start: v.start_date,
    p_end: v.end_date,
    p_hours: v.service === 'walk' ? v.hours : null,
    p_pet_ids: v.pet_ids,
    p_note: v.note,
  })
  if (error) {
    console.error('Booking request failed', error)
    throw new Error(fromDatabase(error))
  }
  return data as Booking
}

/** Your bookings, as an owner and as a sitter, soonest first */
export async function listMyBookings(): Promise<BookingListing[]> {
  const people = 'owner:profiles!bookings_owner_id_fkey(first_name, avatar_url), sitter:profiles!bookings_sitter_id_fkey(first_name, avatar_url)'
  const load = (cols: string) => supabase.from('bookings').select(`${cols}, ${people}`).order('start_date').limit(200)
  let { data, error } = await load(columns)
  if (error && cancelColumnsMissing(error)) ({ data, error } = await load(baseColumns))
  if (error) throw new Error(fromDatabase(error))
  return data as unknown as BookingListing[]
}

async function answer(fn: 'cancel_booking' | 'decline_booking' | 'accept_free_booking', id: string) {
  const { data, error } = await supabase.rpc(fn, { booking: id })
  if (error) throw new Error(fromDatabase(error))
  if (!data) throw new Error('This booking has already been answered.')
  return data as Booking
}
export const cancelBooking = (id: string) => answer('cancel_booking', id)
export const declineBooking = (id: string) => answer('decline_booking', id)

/** Free bookings are accepted straight away; paid ones charge the owner's card at the same moment */
export async function acceptBooking(b: Pick<Booking, 'id' | 'total_cents'>): Promise<Booking> {
  if (b.total_cents === 0) return answer('accept_free_booking', b.id)
  const { booking } = await callPayments<{ booking: Booking }>('accept-booking', { bookingId: b.id })
  return booking
}
