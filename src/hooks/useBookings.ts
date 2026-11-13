import { useCallback, useEffect, useState } from 'react'
import { listMyBookings } from '../lib/bookings'
import type { BookingListing } from '../lib/bookings'
import { callPayments, getPaymentProfile } from '../lib/payments'
import type { PaymentProfile } from '../lib/payments'
import { listMyReviewedSitters } from '../lib/reviews'
import { useLoader } from './useLoader'
import { useOnAppVisible } from './useOnAppVisible'

/**
 * Your bookings (database script 11), as an owner and as a sitter. Loaded on their own so they never block the app,
 * and again when you come back to the app (new requests) or open Your bookings (the latest answers).
 */
export function useBookings(userId: string, route: string) {
  const { data: bookings, error, refresh: refreshList } = useLoader<BookingListing[]>(listMyBookings, [])
  // Sitters you've reviewed (database script 16): their finished bookings say "Edit your review"
  const [reviewedSitters, setReviewedSitters] = useState<Set<string>>(new Set())
  const refresh = useCallback(() => {
    listMyReviewedSitters(userId).then(setReviewedSitters)
    return refreshList()
  }, [userId, refreshList])
  useEffect(() => {
    refresh()
  }, [refresh])
  useOnAppVisible(refresh)
  useEffect(() => {
    if (route === '/bookings') refresh()
  }, [route, refresh])
  return { bookings, error, refresh, reviewedSitters }
}

/** Your payment details. Coming back from Stripe's payout setup (…#/payments?payouts=back) asks Stripe whether it's done. */
export function usePaymentProfile(userId: string, route: string) {
  const { data: payment, error, refresh } = useLoader<PaymentProfile | null>(() => getPaymentProfile(userId), null)
  useEffect(() => {
    refresh()
  }, [refresh, userId])
  useEffect(() => {
    if (!route.startsWith('/payments?payouts=')) return
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/payments`)
    callPayments('payouts-refresh').catch(() => {}).finally(refresh)
  }, [route, refresh])
  return { payment, error, refresh }
}
