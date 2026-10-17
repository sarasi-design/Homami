import type { LucideIcon, LucideProps } from 'lucide-react'

/**
 * Icon — every icon in Homami comes from Lucide (lucide.dev).
 * This wrapper keeps them consistent: stroke 1.5 always (design decision),
 * and only the sizes used in Figma.
 *   xsmall 16 · small 20 · medium 24 (default) · large 28
 * Icons inherit the text colour of whatever they sit in.
 */
export type IconSize = 'xsmall' | 'small' | 'medium' | 'large'

export const iconPixels: Record<IconSize, number> = {
  xsmall: 16,
  small: 20,
  medium: 24,
  large: 28,
}

export interface IconProps extends Omit<LucideProps, 'size' | 'strokeWidth'> {
  icon: LucideIcon
  size?: IconSize
  /** Text for screen readers. Leave empty when the icon is decoration next to a label. */
  label?: string
}

export function Icon({ icon: Glyph, size = 'medium', label, ...rest }: IconProps) {
  return (
    <Glyph
      size={iconPixels[size]}
      strokeWidth={1.5}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      className="shrink-0"
      {...rest}
    />
  )
}
