import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'

/**
 * ServicePicker — pick one service, e.g. what you're booking a pet sitter for. Each option looks like a
 * ServiceCard (icon, title in Body Bold, Caption description) with its price on the right in Label Bold
 * Dark sage, and is chosen like a ChoiceCard: a 3px Soft sage border. Read out as radio buttons.
 */
export interface ServiceOption {
  id: string
  icon: LucideIcon
  title: string
  description: string
  /** e.g. "25 € / night" or "No fees" */
  price: string
}

export interface ServicePickerProps {
  options: ServiceOption[]
  value: string | null
  onChange: (id: string) => void
  /** id of the heading that names the group */
  labelledBy: string
}

export function ServicePicker({ options, value, onChange, labelledBy }: ServicePickerProps) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="flex flex-col gap-s">
      {options.map(({ id, icon: Icon, title, description, price }) => {
        const on = id === value
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(id)}
            className={clsx(
              'flex w-full cursor-pointer items-center gap-m rounded-card border bg-surface p-l text-left transition-[box-shadow,background-color] duration-150 hover:bg-light-grey/60',
              'outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-sage',
              on ? 'border-transparent shadow-[inset_0_0_0_3px_var(--color-soft-sage)]' : 'border-soft-grey',
            )}
          >
            <Icon size={24} strokeWidth={1} absoluteStrokeWidth aria-hidden className="shrink-0 text-dark-grey" />
            <span className="flex flex-1 flex-col gap-xs">
              <span className="text-body-bold text-dark-grey">{title}</span>
              <span className="text-caption text-medium-grey">{description}</span>
            </span>
            <span className="shrink-0 text-label-bold text-dark-sage">{price}</span>
          </button>
        )
      })}
    </div>
  )
}
