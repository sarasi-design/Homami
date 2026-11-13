import clsx from 'clsx'
import { Trash2 } from 'lucide-react'
import { Avatar } from '../basics/Avatar'
import { ConfirmAction } from './ConfirmAction'

/**
 * PostCard — Figma "Activity--Card-2" (340:6248): Avatar (small, 28px) + "Name shared about Pet"
 * in Body (names bold), the photo (12px corners, full width), the text in Body Medium grey,
 * then "2h ago · City" in Label. Your own posts get a Delete button that asks once to confirm.
 * Like a chat message: a new post shows straight away, slightly faded with "Posting…" until it's saved.
 * If posting (or deleting) doesn't work, a short note in Error and "Try again" show underneath.
 */
export interface PostCardProps {
  authorName: string
  authorPhotoUrl?: string | null
  petName?: string | null
  body?: string | null
  photoUrl?: string | null
  /** e.g. "2h ago" */
  when: string
  city?: string | null
  onDelete?: () => Promise<void> | void
  /** Still being saved, or saving / deleting didn't work */
  status?: 'posting' | 'failed'
  /** What went wrong, when it failed */
  problem?: string | null
  onRetry?: () => void
  /** A new post that didn't post: take it off the wall */
  onDiscard?: () => void
}

export function PostCard({ authorName, authorPhotoUrl, petName, body, photoUrl, when, city, onDelete, status, problem, onRetry, onDiscard }: PostCardProps) {
  return (
    <article className={clsx('flex flex-col gap-m pb-l', status === 'posting' && 'opacity-60')} aria-busy={status === 'posting' || undefined}>
      <header className="flex items-center gap-s">
        <Avatar size="small" name={authorName} src={authorPhotoUrl ?? undefined} />
        <p className="text-body text-dark-grey">
          <strong className="text-body-bold">{authorName}</strong>
          {petName && (
            <>
              {' '}shared about <strong className="text-body-bold">{petName}</strong>
            </>
          )}
        </p>
      </header>
      {photoUrl && <img src={photoUrl} alt={petName ? `${petName}, shared by ${authorName}` : `Shared by ${authorName}`} loading="lazy" className="aspect-[361/240] w-full rounded-card bg-light-sage object-cover" />}
      {body && <p className="text-body whitespace-pre-line text-medium-grey">{body}</p>}
      <footer className="flex min-h-[30px] items-center justify-between gap-s">
        {status === 'failed' ? (
          <p role="alert" className="text-caption text-error">
            {problem ?? 'Not posted'} ·{' '}
            <button type="button" onClick={onRetry} className="cursor-pointer font-semibold underline underline-offset-2">
              Try again
            </button>
            {onDiscard && (
              <>
                {' '}·{' '}
                <button type="button" onClick={onDiscard} className="cursor-pointer font-semibold underline underline-offset-2">
                  Remove
                </button>
              </>
            )}
          </p>
        ) : (
          <p className="text-label text-medium-grey">
            {status === 'posting' ? 'Posting…' : when}
            {status !== 'posting' && city && <> · {city}</>}
          </p>
        )}
        {onDelete && status !== 'posting' && !onDiscard && (
          <ConfirmAction label="Delete" icon={Trash2} confirmLabel="Yes, delete" busyLabel="Deleting…" onConfirm={onDelete} />
        )}
      </footer>
    </article>
  )
}
