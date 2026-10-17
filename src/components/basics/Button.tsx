import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'

/**
 * Button — Figma "Button" (105:8598)
 *
 * Variant names map to the Figma "Stile" property:
 *   primary = Default (sage) · dark = Dark · neutral = Neutral · outline = Outline · ghost = Ghost
 * Sizes (Oct 2026, after review in Storybook) — shared with IconButton so heights line up:
 *   medium 44px — default; main actions, banners, bottom of screens
 *   small  36px — inside cards, e.g. the Add to Circle / Chat pair
 *   xsmall 30px — inline actions in dense rows, e.g. "Set price"; 14px text
 * Buttons fit their text; they only stretch when fullWidth is set.
 */
export type ButtonVariant = 'primary' | 'dark' | 'neutral' | 'outline' | 'ghost'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary-sage text-surface hover:bg-dark-sage',
  dark: 'bg-dark-sage text-surface hover:bg-primary-sage',
  neutral: 'bg-dark-grey text-surface hover:bg-medium-grey',
  outline: 'border border-dark-grey text-dark-grey hover:bg-light-grey',
  ghost: 'text-dark-grey hover:bg-light-grey',
}

const base =
  'inline-flex items-center justify-center rounded-pill whitespace-nowrap ' +
  'transition-colors duration-150 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-sage ' +
  'disabled:opacity-40 disabled:pointer-events-none cursor-pointer'

export type ButtonSize = 'medium' | 'small' | 'xsmall'

const sizeClasses: Record<ButtonSize, { box: string; text: string; icon: number }> = {
  medium: { box: 'h-[44px] px-[20px] gap-s', text: 'text-body-bold', icon: 24 },
  small: { box: 'h-[36px] px-l gap-s', text: 'text-body-bold', icon: 20 },
  xsmall: { box: 'h-[30px] px-m gap-xs', text: 'text-label-bold', icon: 16 },
}

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Optional icon before the label */
  iconLeft?: LucideIcon
  /** Optional icon after the label */
  iconRight?: LucideIcon
  /** Stretch to the width of its container (e.g. buttons in a person card) */
  fullWidth?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'medium',
  iconLeft: IconLeft,
  iconRight: IconRight,
  fullWidth = false,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  const s = sizeClasses[size]
  return (
    <button
      type={type}
      className={clsx(base, s.box, s.text, variantClasses[variant], fullWidth ? 'w-full' : 'w-fit', className)}
      {...rest}
    >
      {IconLeft && <IconLeft size={s.icon} strokeWidth={1.5} aria-hidden />}
      <span>{children}</span>
      {IconRight && <IconRight size={s.icon} strokeWidth={1.5} aria-hidden />}
    </button>
  )
}

/**
 * IconButton — icon-only buttons are perfect circles (Oct 2026 decision).
 * The icon sits in a square 1:1 box with fully round corners. Same size names as Button:
 *   medium 44px circle, 24px icon — header icons; matches the 44px avatar
 *   small  36px circle, 20px icon — actions inside cards
 *   xsmall 30px circle, 16px icon — badges, e.g. the camera on a photo; tap area extended invisibly to 46px
 */
export type IconButtonSize = ButtonSize

const iconSizes: Record<IconButtonSize, { box: string; icon: number }> = {
  medium: { box: 'size-[44px]', icon: 24 },
  small: { box: 'size-[36px]', icon: 20 },
  xsmall: { box: 'size-[30px] [&:not(.absolute)]:relative after:absolute after:-inset-[8px] after:content-[""]', icon: 16 },
}

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: LucideIcon
  /** Read out by screen readers, e.g. "Notifications" */
  label: string
  size?: IconButtonSize
  variant?: ButtonVariant
}

export function IconButton({
  icon: Icon,
  label,
  size = 'medium',
  variant = 'ghost',
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  const s = iconSizes[size]
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={clsx(base, 'shrink-0 p-0', s.box, variantClasses[variant], className)}
      {...rest}
    >
      <Icon size={s.icon} strokeWidth={1.5} aria-hidden className="shrink-0" />
    </button>
  )
}
