import type { ReactNode } from 'react'
import { HeartRating } from '../basics/HeartRating'
import { Avatar } from '../basics/Avatar'
import { ratingLabel } from '../../lib/reviews'

/**
 * Reviews — Figma "Reviews" on a sitter's profile (134:17152) and "review--card" (53:4182).
 *
 * ReviewSummary: the card at the top. Big hearts, "4.5/5", "11 reviews", and "Recommended by …" under it.
 * ReviewCard: one review, no border, a Light grey line between them:
 *   their words (Body, Medium grey) · name (Body bold) with their photo · "In your circle · 2 days ago · Málaga"
 *   · "4/5 ♥♥♥♥♡" and "Recommends Daniel" (or nothing when they wouldn't)
 *   With no words: just the name, hearts and whether they recommend.
 */
export interface ReviewSummaryProps {
  ratingAvg: number
  reviewCount: number
  /** "Recommended by Anna and 12 more" (RecommendedBy) */
  recommended?: ReactNode
}

export function ReviewSummary({ ratingAvg, reviewCount, recommended }: ReviewSummaryProps) {
  return (
    <div className="flex flex-col items-center gap-s rounded-card border border-light-grey p-l text-center">
      <HeartRating value={ratingAvg} size="large" />
      <p className="text-title text-dark-sage">{ratingLabel(ratingAvg)}/5</p>
      <p className="text-label text-dark-grey">
        {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
      </p>
      {recommended && <div className="pt-xs">{recommended}</div>}
    </div>
  )
}

export interface ReviewCardProps {
  name: string
  photoUrl?: string | null
  /** "In your circle", "You" */
  relation: string
  when: string
  city?: string | null
  rating: number
  /** First name of the sitter, for "Recommends Daniel"; leave out when they wouldn't recommend */
  recommends?: string
  body?: string | null
}

export function ReviewCard({ name, photoUrl, relation, when, city, rating, recommends, body }: ReviewCardProps) {
  return (
    <article className="flex flex-col gap-s border-b border-light-grey py-l first:pt-0 last:border-b-0">
      {body && <p className="text-body whitespace-pre-line text-medium-grey">{body}</p>}
      <div className="flex items-center gap-s">
        <Avatar size="small" name={name} src={photoUrl ?? undefined} />
        <div className="flex min-w-0 flex-col">
          <p className="text-body-bold text-dark-grey">{name}</p>
          <p className="text-caption text-medium-grey">{[relation, when, city].filter(Boolean).join(' · ')}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-m gap-y-xs">
        <span className="inline-flex items-center gap-xs">
          <span className="text-label-bold text-dark-sage">{rating}/5</span>
          <HeartRating value={rating} />
        </span>
        {recommends && <span className="text-label text-dark-sage">Recommends {recommends}</span>}
      </div>
    </article>
  )
}
