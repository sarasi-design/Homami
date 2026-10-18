import type { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'

/**
 * ChoiceCard — Figma "Card-component / Onboarding": a 92px tall card with a round picture
 * and a bold label, used to pick one option (e.g. Dog or Cat).
 * The chosen card gets a 3px Soft sage border. Put several inside a ChoiceGroup.
 */
export interface ChoiceCardProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string
  image: string
  selected?: boolean
  /** 'center' (Dog / Cat) or 'start' (How will you use Homami?) */
  align?: 'center' | 'start'
}

export function ChoiceCard({ label, image, selected = false, align = 'center', className, ...rest }: ChoiceCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={clsx(
        'flex min-h-[92px] w-full cursor-pointer items-center gap-l text-left', align === 'center' && 'justify-center', 'rounded-small border bg-surface p-l',
        'transition-[box-shadow,background-color,transform] duration-150 hover:bg-light-grey/60 active:scale-[0.99]',
        'outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-sage',
        selected ? 'border-transparent shadow-[inset_0_0_0_3px_var(--color-soft-sage)]' : 'border-soft-grey',
        className,
      )}
      {...rest}
    >
      <img src={image} alt="" className="size-[60px] shrink-0 rounded-pill object-cover" />
      <span className="text-body-bold text-dark-grey">{label}</span>
    </button>
  )
}

export function ChoiceGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-l">
      {children}
    </div>
  )
}
