import { ChevronRight, MapPin } from 'lucide-react'
import { Avatar } from '../basics/Avatar'
import { Icon } from '../basics/Icon'

/**
 * PersonCard — Figma "User-Card-Circle" (134:18417), v1: Avatar (medium, 44px), name in Body Bold,
 * city, and "Shared circle: N" (how many people you both know). The whole card opens their profile.
 * Left for later: status tag, counters, Endorse and Message buttons.
 */
export interface PersonCardProps {
  name: string
  photoUrl?: string | null
  city?: string | null
  sharedCount?: number
  onOpen?: () => void
}

export function PersonCard({ name, photoUrl, city, sharedCount, onOpen }: PersonCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full cursor-pointer items-center gap-l rounded-card border border-soft-grey bg-surface p-l text-left transition-colors hover:bg-light-grey/50 active:bg-light-grey outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-sage"
    >
      <Avatar size="medium" name={name} src={photoUrl ?? undefined} />
      <span className="flex flex-1 flex-col gap-xs">
        <span className="text-body-bold text-dark-grey">{name}</span>
        <span className="flex flex-wrap items-center gap-x-m gap-y-xs text-label text-medium-grey">
          {city && (
            <span className="inline-flex items-center gap-xs">
              <Icon icon={MapPin} size="xsmall" />
              {city}
            </span>
          )}
          {sharedCount !== undefined && (
            <span>
              Shared circle: <strong className="text-label-bold text-dark-sage">{sharedCount}</strong>
            </span>
          )}
        </span>
      </span>
      <Icon icon={ChevronRight} size="small" className="text-dark-grey" />
    </button>
  )
}
