// Made-up bookings for Storybook examples.
import type { BookingListing } from '../lib/bookings'

const inDays = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const base = {
  pet_ids: [],
  note: null,
  payment_status: 'none' as const,
  created_at: new Date().toISOString(),
}

export const ME = 'me'

export const sampleBookings: BookingListing[] = [
  {
    ...base,
    id: 'b1', owner_id: 'eva', sitter_id: ME, service: 'overnight', start_date: inDays(10), end_date: inDays(13), quantity: 3,
    pet_count: 1, unit_price_cents: 2500, total_cents: 7500, status: 'requested', note: 'Berta needs her pill with dinner.',
    owner: { first_name: 'Eva', avatar_url: null }, sitter: { first_name: 'Sara', avatar_url: null },
  },
  {
    ...base,
    id: 'b2', owner_id: ME, sitter_id: 'daniel', service: 'walk', start_date: inDays(3), end_date: inDays(3), quantity: 2,
    pet_count: 1, unit_price_cents: 900, total_cents: 1800, status: 'requested',
    owner: { first_name: 'Sara', avatar_url: null }, sitter: { first_name: 'Daniel', avatar_url: null },
  },
  {
    ...base,
    id: 'b3', owner_id: ME, sitter_id: 'lena', service: 'overnight', start_date: inDays(20), end_date: inDays(24), quantity: 4,
    pet_count: 2, unit_price_cents: 3000, total_cents: 12000, status: 'accepted', payment_status: 'paid',
    owner: { first_name: 'Sara', avatar_url: null }, sitter: { first_name: 'Lena', avatar_url: null },
  },
  {
    ...base,
    id: 'b4', owner_id: 'noah', sitter_id: ME, service: 'sitting_exchange', start_date: inDays(30), end_date: inDays(31), quantity: 2,
    pet_count: 1, unit_price_cents: 0, total_cents: 0, status: 'accepted',
    owner: { first_name: 'Noah', avatar_url: null }, sitter: { first_name: 'Sara', avatar_url: null },
  },
  {
    ...base,
    id: 'b5', owner_id: ME, sitter_id: 'vera', service: 'daily', start_date: inDays(5), end_date: inDays(6), quantity: 2,
    pet_count: 1, unit_price_cents: 2000, total_cents: 4000, status: 'declined',
    owner: { first_name: 'Sara', avatar_url: null }, sitter: { first_name: 'Vera', avatar_url: null },
  },
  {
    ...base,
    id: 'b6', owner_id: ME, sitter_id: 'marco', service: 'overnight', start_date: inDays(8), end_date: inDays(10), quantity: 2,
    pet_count: 1, unit_price_cents: 3000, total_cents: 6000, status: 'cancelled', payment_status: 'partly_refunded',
    cancelled_by: ME, cancel_reason: 'plans_changed', cancel_note: 'Our trip got moved to January, sorry!', refund_cents: 3000,
    owner: { first_name: 'Sara', avatar_url: null }, sitter: { first_name: 'Marco', avatar_url: null },
  },
  {
    ...base,
    id: 'b7', owner_id: ME, sitter_id: 'daniel', service: 'overnight', start_date: inDays(-6), end_date: inDays(-2), quantity: 4,
    pet_count: 1, unit_price_cents: 2500, total_cents: 10000, status: 'accepted', payment_status: 'paid',
    owner: { first_name: 'Sara', avatar_url: null }, sitter: { first_name: 'Daniel', avatar_url: null },
  },
]
