import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import dogUnderRug from '../../assets/empty-dog-rug.webp'
import dogUnderRugMoving from '../../assets/empty-dog-rug.gif'

/**
 * EmptyState — what a list shows when there's nothing in it yet (Figma "No activity to show",
 * on profiles' Recent activity). Not a box or a banner: an illustration, a short title
 * (Body Bold, Dark sage) and one or two lines in Label Medium grey, centred, with an optional
 * action underneath. Use Note for tips and information instead.
 * The dog under the rug moves (Sara, Nov 16, 2026): an animated GIF with a transparent background (only the
 * background: the rug keeps its white stripes), made for white pages. It plays once and stops, no loop.
 * People who ask their phone for less motion see the still picture instead.
 * It plays again each time you open a page (Sara, Nov 16, 2026): browsers remember a GIF that has finished, so
 * each empty state gets its own fresh copy of the (already downloaded) file.
 */
export interface EmptyStateProps {
  title: string
  children?: ReactNode
  /** Defaults to the dog peeking under the rug (moving) */
  image?: string | null
  /** e.g. a Button */
  action?: ReactNode
}

// The moving dog, downloaded once and shared by every empty state
let movingDog: Promise<Blob> | null = null

/** A fresh copy of the moving dog for this page, so it starts from the beginning. The still dog until it's ready. */
function useMovingDog() {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    let url: string | null = null
    let cancelled = false
    movingDog ??= fetch(dogUnderRugMoving).then((r) => (r.ok ? r.blob() : Promise.reject(new Error('No dog'))))
    movingDog
      .then((blob) => {
        if (cancelled) return
        url = URL.createObjectURL(blob)
        setSrc(url)
      })
      .catch(() => {
        movingDog = null
        if (!cancelled) setSrc(dogUnderRugMoving)
      })
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [])
  return src
}

function MovingDog({ className }: { className: string }) {
  const src = useMovingDog()
  return (
    <picture className="flex w-full justify-center">
      <source srcSet={dogUnderRug} media="(prefers-reduced-motion: reduce)" />
      <img src={src ?? dogUnderRug} alt="" aria-hidden className={className} draggable={false} />
    </picture>
  )
}

export function EmptyState({ title, children, image, action }: EmptyStateProps) {
  const pictureClass = 'w-full max-w-[361px] select-none rounded-card'
  return (
    <div className="flex flex-col items-center gap-m py-l text-center">
      {image === undefined ? (
        <MovingDog className={pictureClass} />
      ) : (
        image && <img src={image} alt="" aria-hidden className={pictureClass} draggable={false} />
      )}
      <p className="text-body-bold text-dark-sage">{title}</p>
      {children && <div className="max-w-[300px] text-label text-medium-grey">{children}</div>}
      {action && <div className="pt-xs">{action}</div>}
    </div>
  )
}
