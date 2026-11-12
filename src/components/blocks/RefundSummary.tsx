import { Check } from 'lucide-react'
import clsx from 'clsx'
import { REFUND_TIERS } from '../../lib/cancellation'
import type { Refund } from '../../lib/cancellation'
import { euros } from '../../lib/sitters'

/**
 * Cancelling a paid booking (Sara, Nov 12; not in Figma yet, built like the booking card: 12px corners,
 * Soft grey border, 16px padding).
 *   RefundTiers     the three rules, 100% / 50% / 20% by how long before the first day.
 *                   The one that applies today is Light sage with a check. Also on Find out more.
 *   RefundSummary   what you get back if you cancel now, above the rules. When the sitter cancels,
 *                   the owner gets everything back, so it says that instead.
 */
export function RefundTiers({ current }: { current?: Refund['tier'] }) {
  return (
    <ul className="flex flex-col gap-xs">
      {REFUND_TIERS.map((t) => {
        const on = t.id === current
        return (
          <li
            key={t.id}
            className={clsx('flex items-center gap-s rounded-small px-s py-xs text-label', on ? 'bg-light-sage text-dark-grey' : 'text-medium-grey')}
          >
            <span className="flex size-[16px] shrink-0 items-center justify-center" aria-hidden>
              {on && <Check size={16} strokeWidth={1.5} absoluteStrokeWidth />}
            </span>
            <span className="flex-1">{t.when}</span>
            <span className={on ? 'text-label-bold' : undefined}>{t.percent}% back</span>
            {on && <span className="sr-only">(this applies now)</span>}
          </li>
        )
      })}
    </ul>
  )
}

export interface RefundSummaryProps {
  refund: Refund
  totalCents: number
  /** The pet owner's first name, when you're the sitter */
  ownerName: string
  asSitter: boolean
}

export function RefundSummary({ refund, totalCents, ownerName, asSitter }: RefundSummaryProps) {
  const when = refund.daysBefore <= 0 ? 'The booking starts today' : refund.daysBefore === 1 ? 'The booking starts tomorrow' : `The booking starts in ${refund.daysBefore} days`
  return (
    <div className="flex flex-col gap-m rounded-card border border-soft-grey p-l">
      {asSitter ? (
        <div className="flex flex-col gap-xs">
          <p className="text-title text-dark-grey">
            {ownerName} gets all {euros(totalCents / 100)} back
          </p>
          <p className="text-label text-medium-grey">When a sitter cancels, the owner always gets everything back. Your payout for this booking is taken back too.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-xs">
            <p className="text-title text-dark-grey">
              You get {euros(refund.cents / 100)} back
            </p>
            <p className="text-label text-medium-grey">
              {refund.percent}% of {euros(totalCents / 100)} · {when}
            </p>
          </div>
          <RefundTiers current={refund.tier} />
          <p className="text-caption text-medium-grey">Counted from the first day of the booking. The money goes back to your card in 5–10 days.</p>
        </>
      )}
    </div>
  )
}
