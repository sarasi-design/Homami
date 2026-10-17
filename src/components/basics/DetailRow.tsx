import type { HTMLAttributes, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import clsx from 'clsx'

/**
 * DetailRow — the icon + text lines used for dates, places and pets
 * (Figma "content row" in request cards, offers and profiles).
 *
 *   size   — small (20px icon, inside cards) or medium (24px icon, on profiles)
 *   Wrap the important part in <strong> to make it Label Bold, e.g.
 *   <DetailRow icon={MapPin}><strong>Torremolinos</strong>, Malaga</DetailRow>
 *   Pass onClick to make the whole row tappable; a chevron appears on the right.
 */
export interface DetailRowProps extends HTMLAttributes<HTMLElement> {
  icon: LucideIcon
  size?: 'small' | 'medium'
  children: ReactNode
}

export function DetailRow({ icon: Icon, size = 'small', onClick, className, children, ...rest }: DetailRowProps) {
  const iconSize = size === 'small' ? 20 : 24
  const content = (
    <>
      <Icon size={iconSize} strokeWidth={1.5} aria-hidden className="shrink-0 text-dark-grey" />
      <span className="flex-1 text-label text-medium-grey [&_strong]:font-semibold">{children}</span>
      {onClick && <ChevronRight size={20} strokeWidth={1.5} aria-hidden className="shrink-0 text-dark-grey" />}
    </>
  )
  const base = 'flex items-center gap-s text-left'
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={clsx(
          base,
          'min-h-[44px] -mx-s px-s rounded-small cursor-pointer w-[calc(100%+16px)] hover:bg-light-grey active:bg-soft-grey/40',
          'outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-primary-sage',
          className,
        )}
        {...(rest as HTMLAttributes<HTMLButtonElement>)}
      >
        {content}
      </button>
    )
  }
  return (
    <div className={clsx(base, 'w-full', className)} {...rest}>
      {content}
    </div>
  )
}
