import { describe, expect, it } from 'vitest'
import { canReview, ratingLabel, recommendedByLabel } from './reviews'
import type { KnownRecommender } from './reviews'
import { reviewBits } from './wall'
import type { BookingListing } from './bookings'

// Reviewing pet sitters (Sara, Nov 13, 2026): only the owner, after an accepted booking that has reached its last day
const me = 'owner-1'
const booking = (over: Partial<BookingListing>) => ({ owner_id: me, sitter_id: 'sitter-1', status: 'accepted', end_date: '2026-11-10', ...over }) as BookingListing

describe('canReview', () => {
  it('after the last day of an accepted booking', () => expect(canReview(booking({}), me, '2026-11-13')).toBe(true))
  it('on the last day itself', () => expect(canReview(booking({ end_date: '2026-11-13' }), me, '2026-11-13')).toBe(true))
  it('not before the last day', () => expect(canReview(booking({ end_date: '2026-11-14' }), me, '2026-11-13')).toBe(false))
  it.each(['requested', 'declined', 'cancelled'] as const)('not when the booking was %s', (status) =>
    expect(canReview(booking({ status }), me, '2026-11-13')).toBe(false),
  )
  it('not the sitter reviewing themselves', () => expect(canReview(booking({}), 'sitter-1', '2026-11-13')).toBe(false))
})

const person = (first_name: string, closeness: 0 | 1 | 2): KnownRecommender => ({ id: first_name, first_name, avatar_url: null, closeness })

describe('recommendedByLabel', () => {
  it('nobody yet', () => expect(recommendedByLabel({ recommend_count: 0, known_recommenders: [] })).toBeNull())
  it('nobody you know', () => expect(recommendedByLabel({ recommend_count: 5, known_recommenders: [] })).toBe('Recommended by 5 people'))
  it('one stranger', () => expect(recommendedByLabel({ recommend_count: 1, known_recommenders: [] })).toBe('Recommended by 1 person'))
  it('people you know first', () =>
    expect(recommendedByLabel({ recommend_count: 13, known_recommenders: [person('Anna', 1), person('Marco', 2)] })).toBe(
      'Recommended by Anna, Marco and 11 more',
    ))
  it('just the people you know', () =>
    expect(recommendedByLabel({ recommend_count: 2, known_recommenders: [person('Anna', 1), person('Marco', 1)] })).toBe('Recommended by Anna and Marco'))
  it('you count as "you"', () => expect(recommendedByLabel({ recommend_count: 4, known_recommenders: [person('Sara', 0)] })).toBe('Recommended by you and 3 more'))
})

describe('hearts on the wall', () => {
  it('nothing when there are no reviews', () => expect(reviewBits(undefined)).toEqual({}))
  it('hearts and the badge', () => {
    const bits = reviewBits({ sitter_id: 's', review_count: 3, rating_avg: 4.7, recommend_count: 2, known_recommenders: [person('Anna', 1)] })
    expect(bits.rating).toEqual({ avg: 4.7, count: 3 })
    expect(bits.recommended?.label).toBe('Recommended by Anna and 1 more')
  })
  it('hearts but no badge when nobody recommends them', () => {
    const bits = reviewBits({ sitter_id: 's', review_count: 1, rating_avg: 2, recommend_count: 0, known_recommenders: [] })
    expect(bits.rating).toEqual({ avg: 2, count: 1 })
    expect(bits.recommended).toBeUndefined()
  })
  it('"4" and "4.5"', () => {
    expect(ratingLabel(4)).toBe('4')
    expect(ratingLabel(4.5)).toBe('4.5')
  })
})
