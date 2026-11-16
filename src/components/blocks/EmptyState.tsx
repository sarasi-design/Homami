import type { ReactNode } from 'react'
import dogUnderRug from '../../assets/empty-dog-rug.webp'
import dogUnderRugMoving from '../../assets/empty-dog-rug.gif'

/**
 * EmptyState — what a list shows when there's nothing in it yet (Figma "No activity to show",
 * on profiles' Recent activity). Not a box or a banner: an illustration, a short title
 * (Body Bold, Dark sage) and one or two lines in Label Medium grey, centred, with an optional
 * action underneath. Use Note for tips and information instead.
 * The dog under the rug moves (Sara, Nov 16, 2026): an animated GIF with a transparent background, made for white
 * pages. People who ask their phone for less motion see the still picture instead.
 */
export interface EmptyStateProps {
  title: string
  children?: ReactNode
  /** Defaults to the dog peeking under the rug (moving) */
  image?: string | null
  /** e.g. a Button */
  action?: ReactNode
}

export function EmptyState({ title, children, image, action }: EmptyStateProps) {
  const pictureClass = 'w-full max-w-[361px] select-none rounded-card'
  return (
    <div className="flex flex-col items-center gap-m py-l text-center">
      {image === undefined ? (
        <picture className="flex w-full justify-center">
          <source srcSet={dogUnderRug} media="(prefers-reduced-motion: reduce)" />
          <img src={dogUnderRugMoving} alt="" aria-hidden className={pictureClass} draggable={false} />
        </picture>
      ) : (
        image && <img src={image} alt="" aria-hidden className={pictureClass} draggable={false} />
      )}
      <p className="text-body-bold text-dark-sage">{title}</p>
      {children && <div className="max-w-[300px] text-label text-medium-grey">{children}</div>}
      {action && <div className="pt-xs">{action}</div>}
    </div>
  )
}
