import type { OfferId } from './sitters'

/**
 * Not built yet (Sara, Nov 14, 2026): picking these shows "Coming soon" instead, and counts the interest
 * (see interest.ts, database script 18). Turning one *off* still works, for anything saved before.
 */
export const STAY_FOR_CARE_LABEL = 'Stay in exchange for care'
/** The same idea as a tag, in "What you offer" and "What you need" */
export const COMING_SOON_OFFERS: readonly OfferId[] = ['accommodation_exchange']
