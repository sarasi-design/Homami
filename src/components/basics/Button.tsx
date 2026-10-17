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
 * IconButton — the icon-only use of the Figma Button (header, nav, inline icons).
 * Sizes follow Figma: large 40px (icon 28), medium 36px (icon 24), small 30px (icon 16).
 */
export type IconButtonSize = 'large' | 'medium' | 'small'

const iconSizes: Record<IconButtonSize, { box: string; icon: number }> = {
  large: { box: 'h-[40px] px-m', icon: 28 },
  medium: { box: 'h-[36px] px-m', icon: 24 },
  small: { box: 'h-[30px] px-s', icon: 16 },
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
      className={clsx(base, s.box, variantClasses[variant], className)}
      {...rest}
    >
      <Icon size={s.icon} strokeWidth={1.5} aria-hidden />
    </button>
  )
}
