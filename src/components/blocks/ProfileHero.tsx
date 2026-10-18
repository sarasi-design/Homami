import type { ReactNode } from 'react'
import { MapPin } from 'lucide-react'
import { Avatar } from '../basics/Avatar'
import { DetailRow } from '../basics/DetailRow'

/**
 * ProfileHero — Figma "Hero-infos" (4:729): the top of a profile.
 * Avatar (large, 80px) next to the name in Title Large, the city as a Detail row,
 * the bio in Body Medium grey, then the actions. A Soft grey line underneath.
 * `status` is the round Tag under the name (e.g. "Available now" for pet sitters).
 * v1 leaves out the counters, Endorse/Share and Shared circle.
 */
export interface ProfileHeroProps {
  name: string
  photoUrl?: string | null
  city?: string | null
  bio?: string | null
  /** Shown in place of the bio when there isn't one yet */
  bioPlaceholder?: string
  /** Buttons under the bio, e.g. Edit profile */
  actions?: ReactNode
  /** e.g. <Tag color="sage">Available now</Tag> */
  status?: ReactNode
}

export function ProfileHero({ name, photoUrl, city, bio, bioPlaceholder, actions, status }: ProfileHeroProps) {
  return (
    <section className="flex flex-col gap-l border-b border-soft-grey pt-l pb-xl">
      <div className="flex items-center gap-[20px]">
        <Avatar size="large" name={name} src={photoUrl ?? undefined} />
        <div className="flex flex-col items-start gap-xs">
          <h1 className="text-title-large text-dark-grey">{name}</h1>
          {status}
        </div>
      </div>
      {city && <DetailRow icon={MapPin}>{city}</DetailRow>}
      {bio ? (
        <p className="text-body whitespace-pre-line text-dark-grey">{bio}</p>
      ) : (
        bioPlaceholder && <p className="text-body text-medium-grey">{bioPlaceholder}</p>
      )}
      {actions && <div className="flex gap-s">{actions}</div>}
    </section>
  )
}
