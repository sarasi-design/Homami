import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'

/**
 * Button — Figma "Button" (105:8598)
 *
 * Variant names map to the Figma "Stile" property:
 *   primary = Default (sage) · dark = Dark · neutral = Neutral · outline = Outline · ghost = Ghost
 * Labelled buttons are always the 36px size (Figma Size=Small), as decided Oct 2026.
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
  'inline-flex items-center justify-center gap-s rounded-pill whitespace-nowrap ' +
  'transition-colors duration-150 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-sage ' +
  'disabled:opacity-40 disabled:pointer-events-none cursor-pointer'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant
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
  iconLeft: IconLeft,
  iconRight: IconRight,
  fullWidth = false,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(base, 'h-[36px] px-m py-[6px] text-body-bold', variantClasses[variant], fullWidth && 'w-full', className)}
      {...rest}
    >
      {IconLeft && <IconLeft size={24} strokeWidth={1.5} aria-hidden />}
      <span>{children}</span>
      {IconRight && <IconRight size={24} strokeWidth={1.5} aria-hidden />}
    </button>
  )
}

/**
 * IconButton — icon-only buttons are perfect circles (Oct 2026 decision).
 * The icon sits in a square 1:1 box with fully round corners.
 *   large  44px circle, 24px icon — header icons; matches the 44px avatar and is a comfortable tap size
 *   medium 36px circle, 20px icon — inline actions inside cards
 *   small  28px circle, 16px icon — badges, e.g. the camera on a photo; tap area is extended invisibly to 44px
 */
export type IconButtonSize = 'large' | 'medium' | 'small'

const iconSizes: Record<IconButtonSize, { box: string; icon: number }> = {
  large: { box: 'size-[44px]', icon: 24 },
  medium: { box: 'size-[36px]', icon: 20 },
  small: { box: 'size-[28px] [&:not(.absolute)]:relative after:absolute after:-inset-[8px] after:content-[""]', icon: 16 },
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
