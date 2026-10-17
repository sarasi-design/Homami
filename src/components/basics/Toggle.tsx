import { useId } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

/**
 * Toggle — Figma "Switcher" (150:6500). An on/off switch, 44×24.
 *   on  — Primary sage track, knob on the right
 *   off — Medium grey track (5.8:1 on white, so the off state is easy to see), knob on the left
 *   disabled — 40% opacity
 * Use `label` for visible text next to the switch, or `aria-label` when the text sits elsewhere.
 */
export interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: ReactNode
  /** Smaller text under the label */
  description?: ReactNode
}

export function Toggle({ checked, onChange, label, description, disabled, className, id, ...rest }: ToggleProps) {
  const autoId = useId()
  const toggleId = id ?? autoId
  const sw = (
    <button
      id={toggleId}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={label ? `${toggleId}-label` : undefined}
      aria-describedby={description ? `${toggleId}-desc` : undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative h-[24px] w-[44px] shrink-0 cursor-pointer rounded-pill transition-colors duration-150',
        checked ? 'bg-primary-sage' : 'bg-medium-grey',
        'outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-sage',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        // invisible bigger tap area
        'after:absolute after:-inset-[10px] after:content-[""]',
        !label && className,
      )}
      {...rest}
    >
      <span
        aria-hidden
        className={clsx(
          'absolute top-[2px] size-[20px] rounded-pill bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-[left] duration-150 motion-reduce:transition-none',
          checked ? 'left-[22px]' : 'left-[2px]',
        )}
      />
    </button>
  )
  if (!label) return sw
  return (
    <div className={clsx('flex w-full items-start justify-between gap-l', className)}>
      <div className="flex flex-col gap-xs">
        <span id={`${toggleId}-label`} className="text-body-bold text-dark-grey">{label}</span>
        {description && <span id={`${toggleId}-desc`} className="text-caption text-medium-grey">{description}</span>}
      </div>
      {sw}
    </div>
  )
}
