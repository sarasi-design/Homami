import { PawPrint } from 'lucide-react'
import { Avatar } from '../basics/Avatar'
import { Icon } from '../basics/Icon'

/**
 * RecommendationCard — one recommendation on a sitter's profile and on their public page
 * (Sara, Nov 15, 2026; the "Endorse" step of Figma Chat+book 140:6880, which has no screen yet,
 * so it follows ReviewCard 53:4182): no border, a Light grey line between cards.
 *   photo + first name (Body bold) · "In your circle · 2 days ago" (Caption)
 *   "Looked after Luna and Milo" with a paw (members only; the public page has no pets)
 *   the note, if any (Body, Medium grey)
 */
export interface RecommendationCardProps {
  name: string
  photoUrl?: string | null
  /** "In your circle", "You", or nothing for someone you don't know */
  relation?: string
  when: string
  /** "Looked after Luna and Milo" */
  pets?: string | null
  note?: string | null
}

export function RecommendationCard({ name, photoUrl, relation, when, pets, note }: RecommendationCardProps) {
  return (
    <article className="flex flex-col gap-s border-b border-light-grey py-l first:pt-0 last:border-b-0">
      <div className="flex items-center gap-s">
        <Avatar size="small" name={name} src={photoUrl ?? undefined} />
        <div className="flex min-w-0 flex-col">
          <p className="truncate text-body-bold text-dark-grey">{name}</p>
          <p className="text-caption text-medium-grey">{[relation, when].filter(Boolean).join(' · ')}</p>
        </div>
      </div>
      {pets && (
        <p className="inline-flex items-center gap-xs text-label text-dark-sage">
          <Icon icon={PawPrint} size="small" />
          {pets}
        </p>
      )}
      {note && <p className="text-body whitespace-pre-line text-medium-grey">{note}</p>}
    </article>
  )
}
