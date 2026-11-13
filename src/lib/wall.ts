import type { WallFilter, WallItem } from '../screens/CircleScreens'
import type { SitterListing } from './sitters'
import { availabilityLabel, priceSummary } from './sitters'
import type { RequestListing } from './requests'
import { recommendedByLabel } from './reviews'
import type { ReviewSummary } from './reviews'

/**
 * The wall's rules (Sara, Oct 18): your circle's posts, with pet sitters and people asking for care in between.
 *   Placing people: your circle, then your extended circle, then your city ("Near you"), then everyone else.
 *   Mixing: sitters and requests take turns; one of them after every 3 posts; any left over go at the end.
 *   With no circle yet, the wall is all sitters and requests.
 */

type Group = 'circle' | 'extended' | 'other'
type Placed = WallItem & { group: Group }

export interface WallPeople {
  circleIds: Set<string>
  extendedIds: Set<string>
  /** Your city, to show "Near you" */
  myCity: string | null | undefined
}

/** Where someone sits on the wall, and the label under their name */
export function relationOf(userId: string, city: string | null | undefined, people: WallPeople): { rank: number; label: string; group: Group } {
  if (people.circleIds.has(userId)) return { rank: 0, label: 'In your circle', group: 'circle' }
  if (people.extendedIds.has(userId)) return { rank: 1, label: 'In your extended circle', group: 'extended' }
  const theirs = city?.trim()
  const mine = people.myCity?.trim().toLowerCase()
  if (theirs && theirs.toLowerCase() === mine) return { rank: 2, label: `Near you · ${theirs}`, group: 'other' }
  return { rank: 3, label: theirs ?? 'On Homami', group: 'other' }
}

/** Hearts and "Recommended by Anna and 12 more" for a sitter card (database script 16) */
export function reviewBits(r: ReviewSummary | undefined) {
  if (!r || r.review_count === 0) return {}
  const label = recommendedByLabel(r)
  return {
    rating: { avg: r.rating_avg, count: r.review_count },
    recommended: label
      ? { label, people: r.known_recommenders.map((p) => ({ name: p.first_name ?? 'Homami member', photoUrl: p.avatar_url })) }
      : undefined,
  }
}

/** Pet sitters as wall cards, closest relation first */
export function sitterCards(sitters: SitterListing[], people: WallPeople, reviews: Record<string, ReviewSummary> = {}): Placed[] {
  return sitters
    .map((s) => ({ s, rel: relationOf(s.user_id, s.profile?.city, people) }))
    .sort((a, b) => a.rel.rank - b.rel.rank)
    .map(({ s, rel }) => ({
      kind: 'sitter' as const,
      id: s.user_id,
      group: rel.group,
      name: s.profile?.first_name ?? 'Pet sitter',
      photoUrl: s.profile?.avatar_url,
      relation: rel.label,
      availability: availabilityLabel(s.available_from, s.available_until),
      offers: s.offers,
      price: priceSummary(s),
      ...reviewBits(reviews[s.user_id]),
    }))
}

/** People asking for pet care as wall cards, closest relation first (soonest first within each group) */
export function requestCards(requests: RequestListing[], people: WallPeople): Placed[] {
  return requests
    .map((r) => ({ r, rel: relationOf(r.owner_id, r.owner?.city, people) }))
    .sort((a, b) => a.rel.rank - b.rel.rank)
    .map(({ r, rel }) => ({
      kind: 'request' as const,
      id: r.id,
      ownerId: r.owner_id,
      group: rel.group,
      name: r.owner?.first_name ?? 'Someone',
      photoUrl: r.owner?.avatar_url,
      relation: rel.label,
      needs: r.needs,
      startDate: r.start_date,
      endDate: r.end_date,
      area: r.area,
    }))
}

/** Sitters and requests take turns, so neither crowds the other out */
export function alternate<T>(a: T[], b: T[]): T[] {
  const out: T[] = []
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (i < a.length) out.push(a[i])
    if (i < b.length) out.push(b[i])
  }
  return out
}

/** A card after every 3 posts; any cards left over go at the end */
export function mix<T>(posts: T[], cards: T[]): T[] {
  const out: T[] = []
  let k = 0
  posts.forEach((p, i) => {
    out.push(p)
    if ((i + 1) % 3 === 0 && k < cards.length) out.push(cards[k++])
  })
  return [...out, ...cards.slice(k)]
}

const inGroup = (group: Group) => (x: { group: Group }) => x.group === group

/** Everything on the wall, in order, for the chosen filter */
export function buildWall(filter: WallFilter, posts: WallItem[], sitters: Placed[], requests: Placed[]): WallItem[] {
  switch (filter) {
    case 'sitters':
      return sitters
    case 'requests':
      return requests
    case 'extended':
      return alternate<WallItem>(sitters.filter(inGroup('extended')), requests.filter(inGroup('extended')))
    case 'circle':
      return mix(posts, alternate<WallItem>(sitters.filter(inGroup('circle')), requests.filter(inGroup('circle'))))
    default:
      return mix(posts, alternate<WallItem>(sitters, requests))
  }
}
