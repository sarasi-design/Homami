import { supabase } from './supabase'
import { todayIso } from './bookings'
import type { BookingListing } from './bookings'

/**
 * Reviewing and recommending pet sitters (database script 16; Sara, Nov 13, 2026).
 *   Only after a booking that was accepted, not cancelled, and has reached its last day.
 *   1–5 hearts, "Would you recommend them?" and a few words if you like. One per person per sitter.
 *   Everyone sees the numbers; who wrote what only shows to the writer's circle and extended circle.
 */

/** How well you know someone: 0 you, 1 your circle, 2 your extended circle */
export type Closeness = 0 | 1 | 2

export interface KnownRecommender {
  id: string
  first_name: string | null
  avatar_url: string | null
  closeness: Closeness
}

export interface ReviewSummary {
  sitter_id: string
  review_count: number
  rating_avg: number
  recommend_count: number
  /** Up to 3 people you know who recommend them, closest first */
  known_recommenders: KnownRecommender[]
}

export interface SitterReview {
  author_id: string
  first_name: string | null
  city: string | null
  avatar_url: string | null
  closeness: Closeness
  rating: number
  recommend: boolean
  body: string | null
  updated_at: string
}

export interface MyReview {
  sitter_id: string
  rating: number
  recommend: boolean
  body: string | null
  updated_at: string
}

export interface ReviewValues {
  rating: number
  recommend: boolean
  body: string
}

const offline = 'We couldn’t reach Homami. Check your connection and try again.'
const needsUpdate = 'Homami’s database needs an update for reviews (setup script 16). Please try again later.'
const missing = (error: { code?: string; message?: string }) =>
  ['42P01', '42883', 'PGRST202', 'PGRST205'].includes(error.code ?? '') || /relation|schema cache|Could not find the function/i.test(error.message ?? '')
const fromDatabase = (error: { code?: string; message?: string }) =>
  missing(error) ? needsUpdate : error.code === 'P0001' && error.message ? error.message : offline

/** The numbers for these sitters. Before script 16 there are none, and cards simply show no reviews. */
export async function getReviewSummaries(sitterIds: string[]): Promise<Record<string, ReviewSummary>> {
  if (sitterIds.length === 0) return {}
  const { data, error } = await supabase.rpc('sitter_review_summaries', { p_sitters: sitterIds })
  if (error) {
    if (missing(error)) return {}
    throw new Error(offline)
  }
  const out: Record<string, ReviewSummary> = {}
  for (const row of (data ?? []) as ReviewSummary[]) out[row.sitter_id] = { ...row, rating_avg: Number(row.rating_avg) }
  return out
}

/** The reviews you may read for one sitter: yours, your circle's, your extended circle's */
export async function listReviews(sitterId: string): Promise<SitterReview[]> {
  const { data, error } = await supabase.rpc('sitter_reviews_for', { p_sitter: sitterId })
  if (error) {
    if (missing(error)) return []
    throw new Error(offline)
  }
  return (data ?? []) as SitterReview[]
}

/** Your own review of this sitter, if you wrote one */
export async function getMyReview(me: string, sitterId: string): Promise<MyReview | null> {
  const { data, error } = await supabase
    .from('sitter_reviews')
    .select('sitter_id, rating, recommend, body, updated_at')
    .eq('author_id', me)
    .eq('sitter_id', sitterId)
    .maybeSingle()
  if (error) {
    if (missing(error)) return null
    throw new Error(offline)
  }
  return data as MyReview | null
}

/** All the sitters you've reviewed, to know which finished bookings still ask "How did it go?" */
export async function listMyReviewedSitters(me: string): Promise<Set<string>> {
  const { data, error } = await supabase.from('sitter_reviews').select('sitter_id').eq('author_id', me)
  if (error) return new Set()
  return new Set((data ?? []).map((r) => r.sitter_id as string))
}

export async function saveReview(sitterId: string, v: ReviewValues): Promise<void> {
  const { error } = await supabase.rpc('review_sitter', { p_sitter: sitterId, p_rating: v.rating, p_recommend: v.recommend, p_body: v.body })
  if (error) {
    console.error('Saving the review failed', error)
    throw new Error(fromDatabase(error))
  }
}

export async function removeReview(me: string, sitterId: string): Promise<void> {
  const { error } = await supabase.from('sitter_reviews').delete().eq('author_id', me).eq('sitter_id', sitterId)
  if (error) throw new Error(fromDatabase(error))
}

/** You booked them, they accepted, it wasn't cancelled, and it has reached its last day */
export const canReview = (b: BookingListing, me: string, today = todayIso()) =>
  b.owner_id === me && b.status === 'accepted' && b.end_date <= today

// ---- Words for people ----------------------------------------------------------------------

/** "4", "4.5" */
export const ratingLabel = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

/**
 * The badge on sitter cards and profiles:
 *   "Recommended by Anna and 12 more" · "Recommended by Anna and Marco" · "Recommended by you and 3 more"
 *   "Recommended by 5 people" (nobody you know) · null when nobody recommends them yet
 */
export function recommendedByLabel(s: Pick<ReviewSummary, 'recommend_count' | 'known_recommenders'>) {
  if (s.recommend_count === 0) return null
  const names = s.known_recommenders.slice(0, 2).map((p) => (p.closeness === 0 ? 'you' : (p.first_name ?? 'a friend')))
  const more = s.recommend_count - names.length
  if (names.length === 0) return `Recommended by ${s.recommend_count} ${s.recommend_count === 1 ? 'person' : 'people'}`
  if (more === 0) return `Recommended by ${names.join(' and ')}`
  return `Recommended by ${names.join(', ')} and ${more} more`
}

export const closenessLabel = (c: Closeness) => (c === 0 ? 'You' : c === 1 ? 'In your circle' : 'In your extended circle')

/** "2 hours ago", "3 days ago", "5 Nov" */
export function whenLabel(iso: string, now = Date.now()) {
  const mins = Math.round((now - Date.parse(iso)) / 60000)
  if (mins < 60) return 'Just now'
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
