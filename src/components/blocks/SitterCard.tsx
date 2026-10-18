import { ChevronRight, MapPin } from 'lucide-react'
import { Avatar } from '../basics/Avatar'
import { Icon } from '../basics/Icon'
import { Tag } from '../basics/Tag'
import { OFFERS } from '../../lib/sitters'

/**
 * SitterCard — a pet sitter in the "Pet sitters" list. Same card as PersonCard
 * (12px corners, Soft grey border, Avatar medium, whole card opens the profile), plus:
 *   a status Tag ("Available now" / "Available from 3 Nov", round, Light sage),
 *   "In your circle" (round, Pale bubble) when you already know them,
 *   their offers as small square Tags, and the price line ("From 9 €").
 */
export interface SitterCardProps {
  name: string
  photoUrl?: string | null
  city?: string | null
  availability: string
  inCircle?: boolean
  offers: string[]
  price?: string | null
  onOpen?: () => void
}

export function SitterCard({ name, photoUrl, city, availability, inCircle, offers, price, onOpen }: SitterCardProps) {
  const shown = OFFERS.filter((o) => offers.includes(o.id))
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full cursor-pointer items-start gap-l rounded-card border border-soft-grey bg-surface p-l text-left transition-colors hover:bg-light-grey/50 active:bg-light-grey outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-sage"
    >
      <Avatar size="medium" name={name} src={photoUrl ?? undefined} />
      <span className="flex min-w-0 flex-1 flex-col gap-s">
        <span className="flex flex-col gap-xs">
          <span className="text-body-bold text-dark-grey">{name}</span>
          <span className="flex flex-wrap items-center gap-x-m gap-y-xs text-label text-medium-grey">
            {city && (
              <span className="inline-flex items-center gap-xs">
                <Icon icon={MapPin} size="xsmall" />
                {city}
              </span>
            )}
            {price && <strong className="text-label-bold text-dark-sage">{price}</strong>}
          </span>
        </span>
        <span className="flex flex-wrap gap-xs">
          <Tag size="small" color="sage">
            {availability}
          </Tag>
          {inCircle && (
            <Tag size="small" color="bubble">
              In your circle
            </Tag>
          )}
        </span>
        {shown.length > 0 && (
          <span className="flex flex-wrap gap-xs">
            {shown.map((o) => (
              <Tag key={o.id} size="small" shape="square" color={o.color}>
                {o.label}
              </Tag>
            ))}
          </span>
        )}
      </span>
      <Icon icon={ChevronRight} size="small" className="mt-m text-dark-grey" />
    </button>
  )
}
