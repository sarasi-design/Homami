import type { ReactNode } from 'react'
import { CalendarDays, Euro, PawPrint } from 'lucide-react'
import { Avatar } from '../basics/Avatar'
import { DetailRow } from '../basics/DetailRow'
import { Tag } from '../basics/Tag'
import type { TagColor } from '../basics/Tag'
import { SERVICES, priceLine, todayIso, totalLabel } from '../../lib/bookings'
import type { BookingStatus, PaymentStatus, ServiceId } from '../../lib/bookings'
import { euros } from '../../lib/sitters'
import { dateRangeLabel } from '../../lib/requests'

/**
 * BookingCard — one booking, on Your bookings. Same card as Offers and Requests (12px corners,
 * Soft grey border, 16px padding):
 *   the other person (Avatar small + "You asked Daniel" / "Eva asked you"), tap to open their profile
 *   status Tag: Waiting for an answer (Pale gold) · Booked · paid (Light sage) · Done · paid once it's over · Declined / Cancelled (Light grey)
 *               · Payment didn't go through (Salmon) · Cancelled · 60 € refunded (Light grey)
 *   once cancelled (script 15): who cancelled and why, and their message (Sara, Nov 12)
 *   service, dates, pets, the price line and total; their note if there is one
 *   `actions` underneath (Accept / Decline for sitters, Cancel request for owners)
 */
export interface BookingCardProps {
  /** The other person */
  name: string
  photoUrl?: string | null
  /** Are you the sitter in this booking? */
  asSitter: boolean
  service: ServiceId
  startDate: string
  endDate: string
  quantity: number
  unitCents: number
  totalCents: number
  petCount: number
  note?: string | null
  status: BookingStatus
  paymentStatus: PaymentStatus
  /** Who cancelled and why, once cancelled */
  cancellation?: { byYou: boolean; reason: string; note?: string | null; refundCents: number }
  onOpenPerson?: () => void
  actions?: ReactNode
}

function statusOf(status: BookingStatus, payment: PaymentStatus, free: boolean, refundCents = 0, finished = false): { label: string; color: TagColor } {
  if (status === 'requested' && payment === 'failed') return { label: 'Payment didn’t go through', color: 'salmon' }
  if (status === 'requested') return { label: 'Waiting for an answer', color: 'gold' }
  if (status === 'accepted' && finished) return { label: free || payment !== 'paid' ? 'Done' : 'Done · paid', color: 'sage' }
  if (status === 'accepted') return { label: free || payment !== 'paid' ? 'Booked' : 'Booked · paid', color: 'sage' }
  if (status === 'declined') return { label: 'Declined', color: 'neutral' }
  return { label: refundCents > 0 ? `Cancelled · ${euros(refundCents / 100)} refunded` : 'Cancelled', color: 'neutral' }
}

export function BookingCard(p: BookingCardProps) {
  const s = statusOf(p.status, p.paymentStatus, p.totalCents === 0, p.cancellation?.refundCents, p.endDate < todayIso())
  const who = (
    <>
      <Avatar size="small" name={p.name} src={p.photoUrl ?? undefined} />
      <span className="text-body text-dark-grey">
        {p.asSitter ? (
          <>
            <strong className="text-body-bold">{p.name}</strong> asked you
          </>
        ) : (
          <>
            You asked <strong className="text-body-bold">{p.name}</strong>
          </>
        )}
      </span>
    </>
  )
  return (
    <div className="flex flex-col gap-m rounded-card border border-soft-grey p-l">
      {p.onOpenPerson ? (
        <button
          type="button"
          onClick={p.onOpenPerson}
          className="-m-xs flex cursor-pointer items-center gap-s self-start rounded-small p-xs text-left hover:bg-light-grey/50 outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-primary-sage"
        >
          {who}
        </button>
      ) : (
        <span className="flex items-center gap-s">{who}</span>
      )}
      <span className="flex flex-wrap items-center gap-xs">
        <Tag size="small" color={s.color}>
          {s.label}
        </Tag>
        <span className="inline-flex h-[24px] items-center px-xs text-caption text-medium-grey">{SERVICES[p.service].label}</span>
      </span>
      <div className="flex flex-col gap-s">
        <DetailRow icon={CalendarDays}>
          <strong>{dateRangeLabel(p.startDate, p.endDate)}</strong>
        </DetailRow>
        {p.petCount > 0 && <DetailRow icon={PawPrint}>{p.petCount === 1 ? '1 pet' : `${p.petCount} pets`}</DetailRow>}
        <DetailRow icon={Euro}>
          {p.totalCents > 0 ? (
            <>
              {priceLine(p.service, p.quantity, p.unitCents).replace(/ = .*$/, '')} = <strong>{totalLabel(p.totalCents)}</strong>
            </>
          ) : (
            priceLine(p.service, p.quantity, p.unitCents)
          )}
        </DetailRow>
      </div>
      {p.note && <p className="rounded-small bg-light-grey p-s text-label text-medium-grey">“{p.note}”</p>}
      {p.cancellation && (
        <div className="flex flex-col gap-xs border-t border-light-grey pt-m">
          <p className="text-label text-dark-grey">
            <strong className="text-label-bold">{p.cancellation.byYou ? 'You cancelled' : `${p.name} cancelled`}:</strong> {p.cancellation.reason}
          </p>
          {p.cancellation.note && <p className="text-label text-medium-grey">“{p.cancellation.note}”</p>}
        </div>
      )}
      {p.actions && <div className="flex flex-wrap items-center gap-m">{p.actions}</div>}
    </div>
  )
}
