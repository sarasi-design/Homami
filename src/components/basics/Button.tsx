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

/*
 * States (Oct 2026)
 *   hover    — a 10% shade laid over the button (desktop only; phones have no hover)
 *   pressed  — a 20% shade and a tiny 3% shrink, so a tap feels physical
 *   focus    — keyboard only: a 2px Primary sage ring with a 2px gap; never shows on tap or click
 *   disabled — 40% opacity, not clickable
 * The shade is black on filled buttons and Dark grey on outline/ghost, so every
 * style darkens the same way and no extra colours are needed.
 * Storybook can force a state with data-state="hover" | "pressed" | "focus".
 */
const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary-sage text-surface before:bg-black',
  dark: 'bg-dark-sage text-surface before:bg-black',
  neutral: 'bg-dark-grey text-surface before:bg-black',
  outline: 'border border-dark-grey text-dark-grey before:bg-dark-grey',
  ghost: 'text-dark-grey before:bg-dark-grey',
}

const shade =
  'before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:opacity-0 before:content-[""] ' +
  'before:transition-opacity before:duration-150 ' +
  'hover:before:opacity-10 data-[state=hover]:before:opacity-10 ' +
  'active:before:opacity-20 data-[state=pressed]:before:opacity-20 ' +
  'active:scale-[0.97] data-[state=pressed]:scale-[0.97] motion-reduce:active:scale-100 motion-reduce:data-[state=pressed]:scale-100'

const focus =
  'outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-sage ' +
  'data-[state=focus]:outline-solid data-[state=focus]:outline-2 data-[state=focus]:outline-offset-2 data-[state=focus]:outline-primary-sage'

const base =
  'inline-flex items-center justify-center rounded-pill whitespace-nowrap isolate [&:not(.absolute)]:relative ' +
  'transition-transform duration-150 [-webkit-tap-highlight-color:transparent] select-none ' +
  shade + ' ' + focus + ' ' +
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
  xsmall: { box: 'size-[30px] after:absolute after:-inset-[8px] after:content-[""]', icon: 16 },
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
