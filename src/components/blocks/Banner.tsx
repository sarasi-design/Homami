import type { ReactNode } from 'react'
import clsx from 'clsx'

/**
 * Banner — the coloured boxes with an illustration on the right
 * (Figma "Banner" 105:20180 and the "Share Homami with people you trust" box on Invite friends).
 * 12px corners, Pale peach by default, title in Title (20px), optional button underneath.
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
      <div className={clsx('relative z-10 flex flex-col justify-center gap-m p-l', image && 'pr-[132px]')}>
        <p className="text-title text-dark-grey">{title}</p>
        {action}
      </div>
      {image && (
        <img src={image} alt="" aria-hidden className="pointer-events-none absolute right-[-12px] bottom-[-18px] w-[150px] select-none" draggable={false} />
      )}
    </div>
  )
}
