import { ChevronRight } from 'lucide-react'
import { Avatar } from '../basics/Avatar'
import { Icon } from '../basics/Icon'
import { Tag } from '../basics/Tag'
import { OFFERS } from '../../lib/sitters'

/**
 * SitterPostCard — a pet sitter showing up on the wall, between the posts.
 * Looks different from a post on purpose: a Pale gold card (12px corners, 16px padding).
 *   "Daniel offers pet sitting" (Avatar small + Body, name bold)
 *   how you know them: "In your circle" · "In your extended circle" · "Near you" · their city
 *   availability, offers (small square Tags) and "From 9 €"
 * The whole card opens their profile.
 */
export interface SitterPostCardProps {
  name: string
  photoUrl?: string | null
  /** e.g. "In your circle", "Near you · Málaga" */
  relation: string
  availability: string
  offers: string[]
  price?: string | null
  onOpen?: () => void
}

export function SitterPostCard({ name, photoUrl, relation, availability, offers, price, onOpen }: SitterPostCardProps) {
  const shown = OFFERS.filter((o) => offers.includes(o.id))
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full cursor-pointer flex-col gap-m rounded-card bg-pale-gold p-l text-left transition-colors hover:bg-gold/40 active:bg-gold/50 outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-sage"
    >
      <span className="flex items-center gap-s">
        <Avatar size="small" name={name} src={photoUrl ?? undefined} />
        <span className="flex-1 text-body text-dark-grey">
          <strong className="text-body-bold">{name}</strong> offers pet sitting
        </span>
        <Icon icon={ChevronRight} size="small" className="text-dark-grey" />
      </span>
      <span className="flex flex-wrap gap-xs">
        <Tag size="small" color="sage">
          {availability}
        </Tag>
        <span className="inline-flex h-[24px] items-center px-xs text-caption text-medium-grey">{relation}</span>
      </span>
      {shown.length > 0 && (
        <span className="flex flex-wrap gap-xs">
          {shown.map((o) => (
            <Tag key={o.id} size="small" shape="square" color={o.color === 'gold' ? 'neutral' : o.color}>
              {o.label}
            </Tag>
          ))}
        </span>
      )}
      {price && <span className="text-label-bold text-dark-sage">{price}</span>}
    </button>
  )
}
