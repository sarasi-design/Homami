import type { ReactNode } from 'react'
import dogUnderRug from '../../assets/empty-dog-rug.webp'

/**
 * EmptyState — what a list shows when there's nothing in it yet (Figma "No activity to show",
 * on profiles' Recent activity). Not a box or a banner: an illustration, a short title
 * (Body Bold, Dark sage) and one or two lines in Label Medium grey, centred, with an optional
 * action underneath. Use Note for tips and information instead.
 */
export interface EmptyStateProps {
  title: string
  children?: ReactNode
  /** Defaults to the dog peeking under the rug */
  image?: string | null
  /** e.g. a Button */
  action?: ReactNode
}

export function EmptyState({ title, children, image = dogUnderRug, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-m py-l text-center">
      {image && <img src={image} alt="" aria-hidden className="w-full max-w-[361px] select-none rounded-card" draggable={false} />}
      <p className="text-body-bold text-dark-sage">{title}</p>
      {children && <div className="max-w-[300px] text-label text-medium-grey">{children}</div>}
      {action && <div className="pt-xs">{action}</div>}
    </div>
  )
}
