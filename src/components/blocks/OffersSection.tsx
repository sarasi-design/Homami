import type { ReactNode } from 'react'
import { CalendarDays, Footprints, Handshake, House, MapPinned, Moon, Sun } from 'lucide-react'
import { Tag } from '../basics/Tag'
import { DetailRow } from '../basics/DetailRow'
import { OFFERS, availabilityLabel, euros, formatDate } from '../../lib/sitters'
import type { SitterProfile } from '../../lib/sitters'

/**
 * OffersSection — Figma "Offers- Section" (on Daniel's profile, 127:9167):
 * a card (12px corners, Soft grey border, 16px padding) with
 *   OFFERS           the offer Tags (square, their own pastel colours)
 *   AVAILABLE FROM   the date, and "Up to 30 km from Málaga Centro"
 *   PRICES           one row per priced service, then the free exchange options as Tags
 * Only priced services are listed. `action` sits top-right (e.g. Edit on your own profile).
 */
export interface OffersSectionProps {
  sitter: Omit<SitterProfile, 'user_id'>
  action?: ReactNode
}

function Overline({ children }: { children: ReactNode }) {
  return <h3 className="text-overline text-dark-grey">{children}</h3>
}

export function OffersSection({ sitter, action }: OffersSectionProps) {
  const offers = OFFERS.filter((o) => sitter.offers.includes(o.id))
  const prices = [
    { icon: Sun, label: 'Daily rate', value: sitter.daily_rate, unit: 'day' },
    { icon: Moon, label: 'Overnight stay', value: sitter.overnight_rate, unit: 'night' },
    { icon: Footprints, label: 'Dog walking', value: sitter.walk_rate, unit: 'hour' },
  ].filter((p) => p.value !== null)
  const exchanges = [
    sitter.stay_for_care && { icon: House, label: 'Stay in exchange for care' },
    sitter.sitting_exchange && { icon: Handshake, label: 'Pet sitting exchange' },
  ].filter(Boolean) as { icon: typeof House; label: string }[]
  const where = sitter.area || sitter.radius_km

  return (
    <div className="flex flex-col gap-l rounded-card border border-soft-grey p-l">
      <div className="flex items-start justify-between gap-m">
        <div className="flex flex-col gap-m">
          <Overline>Offers</Overline>
          {offers.length > 0 ? (
            <div className="flex flex-wrap gap-s">
              {offers.map((o) => (
                <Tag key={o.id} shape="square" color={o.color}>
                  {o.label}
                </Tag>
              ))}
            </div>
          ) : (
            <p className="text-label text-medium-grey">Nothing chosen yet</p>
          )}
        </div>
        {action}
      </div>

      <div className="flex flex-col gap-m">
        <Overline>Availability</Overline>
        <DetailRow icon={CalendarDays}>
          {sitter.available_from && availabilityLabel(sitter.available_from) !== 'Available now' ? (
            <>
              From <strong>{formatDate(sitter.available_from)}</strong>
            </>
          ) : (
            <strong>Available now</strong>
          )}
        </DetailRow>
        {where && (
          <DetailRow icon={MapPinned}>
            {sitter.radius_km ? (
              <>
                Up to <strong>{sitter.radius_km} km</strong>
                {sitter.area && (
                  <>
                    {' '}from <strong>{sitter.area}</strong>
                  </>
                )}
              </>
            ) : (
              <strong>{sitter.area}</strong>
            )}
          </DetailRow>
        )}
      </div>

      {(prices.length > 0 || exchanges.length > 0) && (
        <div className="flex flex-col gap-m">
          <Overline>Prices</Overline>
          {prices.map((p) => (
            <DetailRow key={p.label} icon={p.icon}>
              {p.label}: <strong>{euros(p.value as number)}</strong> / {p.unit}
            </DetailRow>
          ))}
          {exchanges.map((e) => (
            <DetailRow key={e.label} icon={e.icon}>
              {e.label} · <strong>no fees</strong>
            </DetailRow>
          ))}
        </div>
      )}
    </div>
  )
}
