import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { canCancel, cancellationMessage, refundIfCancelled } from './cancellation'

// Money back when a paid booking is cancelled (Sara, Nov 12, 2026):
// owner 14+ days before → 100% · 7–13 days → 50% · less than 7 → 20% · sitter cancels → 100%
const owner = 'owner-1'
const sitter = 'sitter-1'
const paid = { sitter_id: sitter, start_date: '2026-12-01', total_cents: 10000, payment_status: 'paid' as const }

describe('refundIfCancelled', () => {
  it.each([
    ['2026-11-01', 100, 'full'],
    ['2026-11-17', 100, 'full'], // exactly 14 days before
    ['2026-11-18', 50, 'half'], // 13 days
    ['2026-11-24', 50, 'half'], // exactly 7 days
    ['2026-11-25', 20, 'late'], // 6 days
    ['2026-12-01', 20, 'late'], // on the first day
  ])('owner cancelling on %s gets %i%% back', (today, percent, tier) => {
    const r = refundIfCancelled(paid, owner, today)
    expect(r.percent).toBe(percent)
    expect(r.tier).toBe(tier)
    expect(r.cents).toBe(10000 * (percent / 100))
  })

  it('gives everything back when the sitter cancels, even at the last minute', () => {
    expect(refundIfCancelled(paid, sitter, '2026-12-01')).toMatchObject({ percent: 100, cents: 10000, tier: 'sitter' })
  })

  it('rounds to whole cents', () => {
    expect(refundIfCancelled({ ...paid, total_cents: 3333 }, owner, '2026-11-20').cents).toBe(1667)
  })

  it('has nothing to give back for free or unpaid bookings', () => {
    expect(refundIfCancelled({ ...paid, total_cents: 0 }, owner, '2026-11-01')).toMatchObject({ cents: 0, tier: 'free' })
    expect(refundIfCancelled({ ...paid, payment_status: 'none' }, owner, '2026-11-01')).toMatchObject({ cents: 0, tier: 'free' })
    expect(refundIfCancelled({ ...paid, payment_status: 'refunded' }, sitter, '2026-11-01').cents).toBe(0)
  })
})

describe('the payments function uses the same rules', () => {
  // The app shows the refund beforehand; the payments function is the one that counts. They must agree.
  const fn = readFileSync('supabase/functions/payments/index.ts', 'utf8')
  it('has the same refund steps', () => {
    expect(fn).toMatch(/if \(bySitter\) return 100/)
    expect(fn).toMatch(/days >= 14 \? 100 : days >= 7 \? 50 : 20/)
  })
})

describe('canCancel', () => {
  it('allows accepted bookings up to and including the first day', () => {
    expect(canCancel({ status: 'accepted', start_date: '2026-12-01' }, '2026-11-30')).toBe(true)
    expect(canCancel({ status: 'accepted', start_date: '2026-12-01' }, '2026-12-01')).toBe(true)
    expect(canCancel({ status: 'accepted', start_date: '2026-12-01' }, '2026-12-02')).toBe(false)
  })
  it('does not apply to requests that were never accepted', () => {
    expect(canCancel({ status: 'requested', start_date: '2026-12-01' }, '2026-11-01')).toBe(false)
    expect(canCancel({ status: 'cancelled', start_date: '2026-12-01' }, '2026-11-01')).toBe(false)
  })
})

describe('cancellationMessage', () => {
  const booking = { service: 'overnight' as const, start_date: '2026-12-01', end_date: '2026-12-03', sitter_id: sitter }
  it('tells the sitter what the owner gets back', () => {
    expect(cancellationMessage(booking, owner, 'plans_changed', '', 5000)).toBe(
      'Sorry, I’ve had to cancel our booking: overnight stay, 1 to 3 December 2026. My plans changed. I’ll get 50 € back.',
    )
  })
  it('tells the owner they get everything back when the sitter cancels', () => {
    expect(cancellationMessage(booking, sitter, 'emergency', 'So sorry!', 10000)).toBe(
      'Sorry, I’ve had to cancel our booking: overnight stay, 1 to 3 December 2026. Something urgent came up. So sorry! You’ll get all 100 € back.',
    )
  })
  it('uses the person’s own words instead of “Something else”', () => {
    expect(cancellationMessage(booking, owner, 'something_else', 'Moving house', 0)).toBe(
      'Sorry, I’ve had to cancel our booking: overnight stay, 1 to 3 December 2026. Moving house',
    )
  })
})
