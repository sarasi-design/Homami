import clsx from 'clsx'

/**
 * CountBadge — the small Primary sage dot with a number, first used on Chats in the bottom nav.
 * Also on your photo in the header and on "Your bookings" when a booking waits for your answer.
 * Shows nothing at 0, and "9+" above 9. Decorative: the button it sits on says the count out loud.
 *   floating  sits on the top-right corner of an icon or photo (the parent needs `relative`)
 */
export interface CountBadgeProps {
  count: number
  floating?: boolean
  className?: string
}

export function CountBadge({ count, floating = false, className }: CountBadgeProps) {
  if (!count) return null
  return (
    <span
      aria-hidden
      className={clsx(
        'flex h-[18px] min-w-[18px] items-center justify-center rounded-pill border-2 border-surface bg-primary-sage px-[3px] text-[11px] font-semibold leading-none text-surface',
        floating && 'absolute -top-[4px] -right-[8px]',
        className,
      )}
    >
      {count > 9 ? '9+' : count}
    </span>
  )
}
