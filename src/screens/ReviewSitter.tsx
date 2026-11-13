import { useState } from 'react'
import { Heart, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react'
import { Button } from '../components/basics/Button'
import { HeartRating } from '../components/basics/HeartRating'
import { Avatar } from '../components/basics/Avatar'
import { Note } from '../components/basics/Note'
import { TextArea } from '../components/basics/TextInput'
import { TextLink } from '../components/basics/TextLink'
import { ConfirmAction } from '../components/blocks/ConfirmAction'
import { Header } from '../components/blocks/Header'
import { ServicePicker } from '../components/blocks/ServicePicker'
import { FormError } from './WelcomeLayout'
import { SERVICES } from '../lib/bookings'
import { dateRangeLabel } from '../lib/requests'
import type { BookingListing } from '../lib/bookings'
import type { MyReview, ReviewValues } from '../lib/reviews'

/**
 * Review a pet sitter — "How did it go?" on a finished booking (Your bookings or the chat), or
 * "Edit your review" on their profile. Sara, Nov 13, 2026 (database script 16); built on one page like
 * Cancel booking, with Figma's hearts (134:17152):
 *   who and which booking · How was it? (1–5 hearts, required) · Would you recommend Lena? (required) ·
 *   A few words (optional; shown to your circle and extended circle) · Share review.
 * Editing shows what you said before, and "Delete review".
 */
export interface ReviewSitterProps {
  sitterName: string
  sitterPhotoUrl?: string | null
  /** The booking it's about (the latest finished one) */
  booking?: BookingListing | null
  /** Your review from before, when editing */
  initial?: MyReview | null
  /** No finished booking with them yet */
  notYet?: boolean
  onSubmit: (values: ReviewValues) => Promise<void>
  onRemove?: () => Promise<void>
  onHowItWorks: () => void
  onBack: () => void
}

export function ReviewSitter({ sitterName, sitterPhotoUrl, booking, initial, notYet, onSubmit, onRemove, onHowItWorks, onBack }: ReviewSitterProps) {
  const [rating, setRating] = useState(initial?.rating ?? 0)
  const [recommend, setRecommend] = useState<boolean | null>(initial ? initial.recommend : null)
  const [body, setBody] = useState(initial?.body ?? '')
  const [triedOnce, setTriedOnce] = useState(false)
  const [sending, setSending] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const errors = {
    rating: triedOnce && !rating ? 'Pick how many hearts' : undefined,
    recommend: triedOnce && recommend === null ? `Say whether you’d recommend ${sitterName}` : undefined,
  }

  async function send() {
    setTriedOnce(true)
    if (!rating || recommend === null) {
      return document.getElementById(!rating ? 'review-hearts' : 'review-recommend')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    setSending(true)
    setFormError(null)
    try {
      await onSubmit({ rating, recommend, body: body.trim() })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setSending(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
      <Header title={initial ? 'Your review' : `Review ${sitterName}`} onBack={onBack} />
      <div className="flex flex-1 flex-col gap-xl px-l pt-s pb-[40px]">
        <div className="flex items-center gap-m">
          <Avatar size="medium" name={sitterName} src={sitterPhotoUrl ?? undefined} />
          <div className="flex flex-col">
            <p className="text-body-bold text-dark-grey">{sitterName}</p>
            {booking && (
              <p className="text-caption text-medium-grey">
                {SERVICES[booking.service].label} · {dateRangeLabel(booking.start_date, booking.end_date)}
              </p>
            )}
          </div>
        </div>

        {notYet ? (
          <Note title="You can review a pet sitter after a booking">
            Once a booking with {sitterName} has finished, you can say how it went and whether you’d recommend them.
          </Note>
        ) : (
          <>
            <section id="review-hearts" className="flex flex-col gap-s">
              <h2 className="text-overline text-dark-grey">How was it?</h2>
              <HeartRating value={rating} onChange={setRating} label={`How was it with ${sitterName}?`} className="-ml-s" />
              {errors.rating && (
                <p role="alert" className="text-label text-error">
                  {errors.rating}
                </p>
              )}
            </section>

            <section id="review-recommend" className="flex flex-col gap-m">
              <h2 id="review-recommend-title" className="text-overline text-dark-grey">
                Would you recommend {sitterName}?
              </h2>
              <ServicePicker
                labelledBy="review-recommend-title"
                value={recommend === null ? null : recommend ? 'yes' : 'no'}
                onChange={(id) => setRecommend(id === 'yes')}
                options={[
                  { id: 'yes', icon: ThumbsUp, title: `Yes, I’d recommend ${sitterName}`, description: 'Your friends see it on their profile' },
                  { id: 'no', icon: ThumbsDown, title: 'Not this time' },
                ]}
              />
              {errors.recommend && (
                <p role="alert" className="text-label text-error">
                  {errors.recommend}
                </p>
              )}
            </section>

            <section className="flex flex-col gap-m">
              <h2 className="text-overline text-dark-grey">A few words</h2>
              <TextArea
                label="A few words"
                hideLabel
                placeholder={`Optional. What was ${sitterName} like with your pets?`}
                helper="Your circle and their friends can read it, with your name."
                maxLength={1000}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </section>

            <p className="text-label text-medium-grey">
              Everyone sees the hearts and how many people recommend {sitterName}.{' '}
              <TextLink onClick={onHowItWorks} className="min-h-0">
                How reviews work
              </TextLink>
            </p>

            {formError && <FormError>{formError}</FormError>}

            <div className="flex flex-col gap-s">
              <Button variant="neutral" fullWidth iconLeft={Heart} onClick={send} disabled={sending} aria-busy={sending || undefined}>
                {sending ? 'Saving…' : initial ? 'Save review' : 'Share review'}
              </Button>
              {initial && onRemove && (
                <div className="flex justify-center">
                  <ConfirmAction icon={Trash2} label="Delete review" confirmLabel="Yes, delete" busyLabel="Deleting…"
                    onConfirm={async () => {
                      setFormError(null)
                      try {
                        await onRemove()
                      } catch (err) {
                        setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
