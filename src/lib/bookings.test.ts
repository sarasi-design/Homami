import { describe, expect, it } from 'vitest'
import { bookableServices, bookingRequestMessage, priceFor, priceLine, totalLabel } from './bookings'
import { euros, priceSummary } from './sitters'
import { cardLabel } from './payments'

// The database works out the real price (script 11); the app shows the same sum beforehand.
describe('priceFor', () => {
  it('counts days including the first and the last', () => {
    expect(priceFor('daily', 20, '2026-12-01', '2026-12-03', 0)).toEqual({ quantity: 3, unitCents: 2000, totalCents: 6000 })
  })
  it('counts nights, at least one', () => {
    expect(priceFor('overnight', 25, '2026-12-01', '2026-12-04', 0)).toEqual({ quantity: 3, unitCents: 2500, totalCents: 7500 })
    expect(priceFor('overnight', 25, '2026-12-01', '2026-12-01', 0).quantity).toBe(1)
  })
  it('counts hours for dog walking', () => {
    expect(priceFor('walk', 9.5, '2026-12-01', '2026-12-01', 2)).toEqual({ quantity: 2, unitCents: 950, totalCents: 1900 })
  })
  it('is free for exchanges', () => {
    expect(priceFor('sitting_exchange', 0, '2026-12-01', '2026-12-05', 0).totalCents).toBe(0)
  })
  it('works across the clock change and the end of the year', () => {
    expect(priceFor('daily', 10, '2026-10-24', '2026-10-26', 0).quantity).toBe(3)
    expect(priceFor('overnight', 10, '2026-12-30', '2027-01-02', 0).quantity).toBe(3)
  })
  it('never loses cents to rounding', () => {
    expect(priceFor('daily', 12.345, '2026-12-01', '2026-12-01', 0).unitCents).toBe(1235)
  })
})

describe('price labels', () => {
  it('shows the sum', () => {
    expect(priceLine('overnight', 3, 2500)).toBe('3 nights × 25 € = 75 €')
    expect(priceLine('walk', 1, 950)).toBe('1 hour × 9.50 € = 9.50 €')
    expect(priceLine('stay_for_care', 4, 0)).toBe('4 days · no fees')
  })
  it('shows euros with or without cents', () => {
    expect(euros(25)).toBe('25 €')
    expect(euros(9.5)).toBe('9.50 €')
    expect(totalLabel(0)).toBe('No fees')
    expect(totalLabel(7550)).toBe('75.50 €')
  })
})

describe('what a sitter offers', () => {
  const sitter = { daily_rate: 20, overnight_rate: 30, walk_rate: null, stay_for_care: true, sitting_exchange: false }
  it('lists bookable services, priced ones first', () => {
    expect(bookableServices(sitter)).toEqual([
      { id: 'overnight', rate: 30 },
      { id: 'daily', rate: 20 },
      { id: 'stay_for_care', rate: 0 },
    ])
  })
  it('shows the cheapest price, or the free options', () => {
    expect(priceSummary(sitter)).toBe('From 20 €')
    expect(priceSummary({ ...sitter, daily_rate: null, overnight_rate: null })).toBe('Exchange, no fees')
    expect(priceSummary({ ...sitter, daily_rate: null, overnight_rate: null, stay_for_care: false })).toBeNull()
  })
})

describe('messages and labels', () => {
  it('writes the booking request for the chat', () => {
    expect(bookingRequestMessage('Daniel', { service: 'daily', start_date: '2026-12-01', end_date: '2026-12-01' })).toBe(
      'Hi Daniel! I’ve sent you a booking request: daily rate, 1 December 2026. You can accept it here in our chat.',
    )
  })
  it('names the card without showing its number', () => {
    expect(cardLabel({ card_brand: 'visa', card_last4: '4242' })).toBe('Visa •••• 4242')
    expect(cardLabel({ card_brand: 'amex', card_last4: '0005' })).toBe('American Express •••• 0005')
    expect(cardLabel({ card_brand: null, card_last4: null })).toBeNull()
  })
})
