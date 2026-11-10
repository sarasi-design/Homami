import { CalendarDays, ChevronRight } from 'lucide-react'
import { Avatar } from '../basics/Avatar'
import { Icon } from '../basics/Icon'
import { Tag } from '../basics/Tag'
import { OFFERS } from '../../lib/sitters'
import type { OfferId } from '../../lib/sitters'
import { dateRangeLabel } from '../../lib/requests'

/**
 * RequestPostCard — someone asking for pet care, on the wall between posts, so pet sitters can find them
 * (Figma flows: "See available pet sitting requests"). The twin of SitterPostCard, with a Peach border
 * instead of Primary sage so asking and offering don't look the same, and the "Needs help" tag
 * from the Figma people cards (134:18417).
 *   "Eva needs pet care" (Avatar small + Body, name bold)
 *   "Needs help" + how you know them ("In your circle" · "Near you · Málaga" · their city)
 *   the dates, the kinds of care (small square Tags) and where
 * The whole card opens their profile, where the full request and Message are.
 */
export interface RequestPostCardProps {
  name: string
  photoUrl?: string | null
  /** e.g. "In your circle", "Near you · Málaga" */
  relation: string
  needs: OfferId[]
  startDate: string
  endDate: string
  area?: string | null
  onOpen?: () => void
}

export function RequestPostCard({ name, photoUrl, relation, needs, startDate, endDate, area, onOpen }: RequestPostCardProps) {
  const shown = OFFERS.filter((o) => needs.includes(o.id))
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full cursor-pointer flex-col gap-m rounded-card border border-peach bg-surface p-l text-left transition-colors hover:bg-pale-salmon active:bg-salmon outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-sage"
    >
      <span className="flex items-center gap-s">
        <Avatar size="small" name={name} src={photoUrl ?? undefined} />
        <span className="flex-1 text-body text-dark-grey">
          <strong className="text-body-bold">{name}</strong> needs pet care
        </span>
        <Icon icon={ChevronRight} size="small" className="text-dark-grey" />
      </span>
      <span className="flex flex-wrap gap-xs">
        <Tag size="small" color="salmon">
          Needs help
        </Tag>
        <span className="inline-flex h-[24px] items-center px-xs text-caption text-medium-grey">{relation}</span>
      </span>
      <span className="flex items-center gap-s text-label text-medium-grey">
        <Icon icon={CalendarDays} size="small" className="shrink-0 text-dark-grey" />
        <span>
          <strong className="font-semibold text-dark-grey">{dateRangeLabel(startDate, endDate)}</strong>
          {area && <> · {area}</>}
        </span>
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
    </button>
  )
}
