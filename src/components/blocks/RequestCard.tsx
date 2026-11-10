import type { ReactNode } from 'react'
import { CalendarDays, MapPinned, PawPrint } from 'lucide-react'
import { Tag } from '../basics/Tag'
import { DetailRow } from '../basics/DetailRow'
import { PetsSection } from './PetsSection'
import type { PetSummary } from './PetsSection'
import { OFFERS } from '../../lib/sitters'
import type { OfferId } from '../../lib/sitters'
import { dateRangeLabel } from '../../lib/requests'

/**
 * RequestCard — a pet care request: Figma "Create a request" preview (91:6973) and the REQUESTS
 * section on profiles (105:16789). Same card as OffersSection (12px corners, Soft grey border,
 * 16px padding), so offers and requests read as a pair on a profile:
 *   title     overline, e.g. "Eva needs" or "Requests"
 *   needs     square Tags in each kind of care's own pastel colour (same colours as Offers)
 *   when      the dates ("1 to 7 September 2026") and where ("Torremolinos, Málaga")
 *   for       the pets, compact like Your pets — or "2 pets" when you can't see them
 *             (pets are only visible to someone's circle)
 * `action` sits top-right (e.g. Edit on your own profile).
 */
export interface RequestCardProps {
  title?: string
  needs: OfferId[]
  startDate: string
  endDate: string
  area?: string | null
  /** The pets, when you can see them; otherwise pass petCount */
  pets?: PetSummary[] | null
  petCount?: number
  action?: ReactNode
}

function Overline({ children }: { children: ReactNode }) {
  return <h3 className="text-overline text-dark-grey">{children}</h3>
}

export function RequestCard({ title = 'Needs', needs, startDate, endDate, area, pets, petCount = 0, action }: RequestCardProps) {
  const tags = OFFERS.filter((o) => needs.includes(o.id))
  const shownPets = pets && pets.length > 0 ? pets : null
  const count = shownPets ? shownPets.length : petCount

  return (
    <div className="flex flex-col gap-l rounded-card border border-soft-grey p-l">
      <div className="flex items-start justify-between gap-m">
        <div className="flex flex-col gap-m">
          <Overline>{title}</Overline>
          <div className="flex flex-wrap gap-s">
            {tags.map((o) => (
              <Tag key={o.id} shape="square" color={o.color}>
                {o.label}
              </Tag>
            ))}
          </div>
        </div>
        {action}
      </div>

      <div className="flex flex-col gap-m">
        <Overline>When</Overline>
        <DetailRow icon={CalendarDays}>
          <strong>{dateRangeLabel(startDate, endDate)}</strong>
        </DetailRow>
        {area && (
          <DetailRow icon={MapPinned}>
            <strong>{area}</strong>
          </DetailRow>
        )}
      </div>

      {count > 0 && (
        <div className="flex flex-col gap-m">
          <Overline>For</Overline>
          {shownPets ? (
            <PetsSection pets={shownPets} />
          ) : (
            <DetailRow icon={PawPrint}>
              <strong>{count === 1 ? '1 pet' : `${count} pets`}</strong>
            </DetailRow>
          )}
        </div>
      )}
    </div>
  )
}
