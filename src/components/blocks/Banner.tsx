import type { ReactNode } from 'react'
import clsx from 'clsx'

/**
 * Banner — the coloured boxes with an illustration on the right
 * (Figma "Banner" 105:20180 and the "Share Homami with people you trust" box on Invite friends).
 * 12px corners, Pale peach by default, title in Title (20px) across the full width, optional button
 * underneath on the left; the picture sits bottom-right next to the button.
 */
export interface BannerProps {
  title: ReactNode
  image?: string
  /** e.g. a Small button */
  action?: ReactNode
  tone?: 'peach' | 'bubble'
}

export function Banner({ title, image, action, tone = 'peach' }: BannerProps) {
  return (
    <div className={clsx('relative flex min-h-[78px] overflow-hidden rounded-card', tone === 'peach' ? 'bg-pale-peach' : 'bg-pale-bubble')}>
      {/* The title runs the full width; with a picture, the button row leaves room for it bottom-right */}
      <div className={clsx('relative z-10 flex w-full flex-col justify-center gap-m p-l', image && action && 'min-h-[140px] justify-between')}>
        <p className={clsx('text-title text-dark-grey', image && !action && 'pr-[116px]')}>{title}</p>
        {action && <div className={clsx('flex', image && 'pr-[120px]')}>{action}</div>}
      </div>
      {image && (
        <img src={image} alt="" aria-hidden className="pointer-events-none absolute right-[-10px] bottom-[-14px] w-[130px] select-none" draggable={false} />
      )}
    </div>
  )
}
