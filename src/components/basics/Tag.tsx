import type { HTMLAttributes, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'

/**
 * Tag — Figma "Tags" (4:653)
 *
 * Small labels for status ("Soon available"), offers ("Pet sitting exchange")
 * and details ("1 Dog"). Tags are read-only: they are never buttons.
 *
 *   color  — the pastel background. Text is always Medium grey, which passes
 *            WCAG AA on every pastel (lowest: Pale peach, 4.6:1).
 *            "plain" has no background, for counts like "28" next to an icon.
 *   shape  — round (pill) for status, square (8px corners) for offers and details
 *   size   — medium 32px (default), small 24px for dense spots inside cards
 */
export type TagColor = 'neutral' | 'sage' | 'gold' | 'glicine' | 'peach' | 'salmon' | 'bubble' | 'plain'
export type TagShape = 'round' | 'square'
export type TagSize = 'medium' | 'small'

const colorClasses: Record<TagColor, string> = {
  neutral: 'bg-light-grey',
  sage: 'bg-light-sage',
  gold: 'bg-pale-gold',
  glicine: 'bg-pale-glicine',
  peach: 'bg-pale-peach',
  salmon: 'bg-salmon',
  bubble: 'bg-pale-bubble',
  plain: 'bg-transparent',
}

const sizeClasses: Record<TagSize, { box: string; text: string; icon: number }> = {
  medium: { box: 'h-[32px] pl-s pr-m gap-s', text: 'text-label', icon: 16 },
  small: { box: 'h-[24px] pl-[6px] pr-s gap-xs', text: 'text-caption', icon: 14 },
}

export interface TagProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color'> {
  color?: TagColor
  shape?: TagShape
  size?: TagSize
  /** Optional icon before the text, e.g. a dog or the people icon */
  icon?: LucideIcon
  children: ReactNode
}

export function Tag({
  color = 'neutral',
  shape = 'round',
  size = 'medium',
  icon: Icon,
  className,
  children,
  ...rest
}: TagProps) {
  const s = sizeClasses[size]
  return (
    <span
      className={clsx(
        'inline-flex w-fit shrink-0 items-center whitespace-nowrap text-medium-grey',
        shape === 'round' ? 'rounded-pill' : 'rounded-small',
        // without a background, drop the side padding so the text lines up with what's around it
        color === 'plain' ? clsx(s.box, 'px-0') : s.box,
        s.text,
        colorClasses[color],
        className,
      )}
      {...rest}
    >
      {Icon && <Icon size={s.icon} strokeWidth={1.5} aria-hidden className="shrink-0" />}
      <span>{children}</span>
    </span>
  )
}
