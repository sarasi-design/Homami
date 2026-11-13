import { useEffect, useState } from 'react'
import { PersonPage } from '../screens/CircleScreens'
import { getPerson } from '../lib/circle'
import type { PersonProfile } from '../lib/circle'
import { listPetsOf } from '../lib/pets'
import type { Pet } from '../lib/pets'
import { getSitterProfile } from '../lib/sitters'
import type { SitterProfile } from '../lib/sitters'
import { listRequestsOf } from '../lib/requests'
import type { CareRequest } from '../lib/requests'
import { getMyReview, getReviewSummaries, listReviews } from '../lib/reviews'
import type { MyReview, ReviewSummary, SitterReview } from '../lib/reviews'
import { go, goBack } from '../lib/router'
import { toPetSummary } from './petSummary'

interface PersonRouteProps {
  id: string
  me: string
  inCircle: boolean
  chattedWith: boolean
  isMe: boolean
  /** You have a finished booking with them */
  canReview: boolean
  onBook: () => void
  onReview: () => void
}

/** Loads one person (in your circle, or a pet sitter), their pets, their pet sitting and their reviews */
export function PersonRoute({ id, me, inCircle, chattedWith, isMe, canReview, onBook, onReview }: PersonRouteProps) {
  const [person, setPerson] = useState<PersonProfile | null | undefined>(undefined)
  const [pets, setPets] = useState<Pet[] | undefined>(undefined)
  const [sitter, setSitter] = useState<SitterProfile | null>(null)
  const [requests, setRequests] = useState<CareRequest[]>([])
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null)
  const [reviews, setReviews] = useState<SitterReview[]>([])
  const [myReview, setMyReview] = useState<MyReview | null>(null)
  useEffect(() => {
    let cancelled = false
    getPerson(id).then((p) => !cancelled && setPerson(p)).catch(() => !cancelled && setPerson(null))
    listRequestsOf(id).then((list) => !cancelled && setRequests(list)).catch(() => {})
    listPetsOf(id).then((list) => !cancelled && setPets(list)).catch(() => !cancelled && setPets([]))
    getSitterProfile(id).then((s) => !cancelled && setSitter(s)).catch(() => {})
    // Reviews load on their own: before database script 16 they're simply empty
    getReviewSummaries([id]).then((all) => !cancelled && setReviewSummary(all[id] ?? null)).catch(() => {})
    listReviews(id).then((list) => !cancelled && setReviews(list)).catch(() => {})
    getMyReview(me, id).then((r) => !cancelled && setMyReview(r)).catch(() => {})
    return () => {
      cancelled = true
    }
  }, [id, me])
  // You can message people in your circle, pet sitters, people asking for pet care (script 10),
  // and anyone you already have a chat with
  const canMessage = !isMe && (inCircle || !!sitter || requests.length > 0 || chattedWith)
  return (
    <PersonPage
      person={person && { name: person.first_name ?? 'New member', photoUrl: person.avatar_url, city: person.city, bio: person.bio }}
      pets={inCircle ? pets?.map(toPetSummary) : null}
      sitter={sitter}
      requests={requests}
      onBook={sitter && !isMe ? onBook : undefined}
      reviewSummary={reviewSummary}
      reviews={reviews}
      review={isMe ? undefined : myReview ? { label: 'Edit your review', onClick: onReview } : canReview ? { label: 'Write a review', onClick: onReview } : undefined}
      onBack={goBack}
      onMessage={canMessage ? () => go(`/chats/${id}`) : undefined}
    />
  )
}
