import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Avatar } from '../basics/Avatar'
import { Button } from '../basics/Button'

/**
 * PostCard — Figma "Activity--Card-2" (340:6248): Avatar (small, 28px) + "Name shared about Pet"
 * in Body (names bold), the photo (12px corners, full width), the text in Body Medium grey,
 * then "2h ago · City" in Label. Your own posts get a Delete button that asks once to confirm.
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
}

export function PostCard({ authorName, authorPhotoUrl, petName, body, photoUrl, when, city, onDelete }: PostCardProps) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  return (
    <article className="flex flex-col gap-m pb-l">
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
        <p className="text-label text-medium-grey">
          {when}
          {city && <> · {city}</>}
        </p>
        {onDelete &&
          (confirming ? (
            <span className="flex items-center gap-xs">
              <Button
                variant="ghost"
                size="xsmall"
                className="text-error"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true)
                  try {
                    await onDelete()
                  } finally {
                    setDeleting(false)
                    setConfirming(false)
                  }
                }}
              >
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </Button>
              <Button variant="ghost" size="xsmall" onClick={() => setConfirming(false)} disabled={deleting}>
                Cancel
              </Button>
            </span>
          ) : (
            <Button variant="ghost" size="xsmall" iconLeft={Trash2} onClick={() => setConfirming(true)}>
              Delete
            </Button>
          ))}
      </footer>
    </article>
  )
}
