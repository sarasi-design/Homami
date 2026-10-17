import { useState } from 'react'
import type { HTMLAttributes } from 'react'
import clsx from 'clsx'

/**
 * Avatar — Figma "Avatar" (2:11)
 *
 * Round profile photo for people and pets.
 *   xlarge 120px — profile hero
 *   large   80px — photo picker, pet profile
 *   medium  44px — header, person cards (same height as medium buttons)
 *   small   28px — feed items, shared circle
 * With no photo (or if it fails to load) it shows initials on Light sage.
 */
export type AvatarSize = 'xlarge' | 'large' | 'medium' | 'small'

const sizeClasses: Record<AvatarSize, { box: string; text: string }> = {
  xlarge: { box: 'size-[120px]', text: 'text-[44px] font-semibold' },
  large: { box: 'size-[80px]', text: 'text-[30px] font-semibold' },
  medium: { box: 'size-[44px]', text: 'text-[17px] font-semibold' },
  small: { box: 'size-[28px]', text: 'text-[11px] font-semibold' },
}

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  /** Photo URL. Leave empty to show initials. */
  src?: string
  /** Full name: used for the initials and read out by screen readers */
  name: string
  size?: AvatarSize
  /** White 2px ring, used when avatars overlap in a group */
  ring?: boolean
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

export function Avatar({ src, name, size = 'medium', ring = false, className, ...rest }: AvatarProps) {
  const [failed, setFailed] = useState(false)
  const s = sizeClasses[size]
  const showPhoto = src && !failed
  return (
    <span
      role="img"
      aria-label={name}
      className={clsx(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-pill',
        s.box,
        !showPhoto && 'bg-light-sage text-dark-sage',
        ring && 'ring-2 ring-surface',
        className,
      )}
      {...rest}
    >
      {showPhoto ? (
        <img src={src} alt="" className="size-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <span aria-hidden className={clsx(s.text, 'leading-none')}>{initials(name)}</span>
      )}
    </span>
  )
}

/**
 * AvatarGroup — overlapping avatars, e.g. the "Shared circle" row on a profile.
 * Shows up to `max` faces; any extra people become a "+N" bubble.
 */
export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  people: { name: string; src?: string }[]
  max?: number
  size?: AvatarSize
}

export function AvatarGroup({ people, max = 5, size = 'small', className, ...rest }: AvatarGroupProps) {
  const shown = people.slice(0, max)
  const extra = people.length - shown.length
  const s = sizeClasses[size]
  return (
    <div className={clsx('flex items-center', className)} {...rest}>
      {shown.map((p, i) => (
        <Avatar key={p.name + i} name={p.name} src={p.src} size={size} ring className={i > 0 ? '-ml-[4px]' : ''} />
      ))}
      {extra > 0 && (
        <span
          className={clsx(
            '-ml-[4px] inline-flex shrink-0 items-center justify-center rounded-pill bg-light-grey text-dark-grey ring-2 ring-surface',
            s.box,
            size === 'small' ? 'text-[11px] font-semibold' : 'text-label-bold',
          )}
          aria-label={`and ${extra} more`}
        >
          +{extra}
        </span>
      )}
    </div>
  )
}
