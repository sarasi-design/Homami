import type { ButtonHTMLAttributes } from 'react'
import { Check, Plus } from 'lucide-react'
import clsx from 'clsx'
import type { TagColor } from './Tag'

/**
 * SelectableTag — a Tag you can tap on and off, for picking several options
 * (Figma "list of services to add" 163:6981: "+ Live-in sitting").
 *   off — white with a Soft grey border and a + icon
 *   on  — its pastel colour (same as the read-only Tag) and a check icon
 * Square shape and Medium size like offer Tags; the tap area is extended invisibly to 44px.
 */
const onColors: Record<Exclude<TagColor, 'plain'>, string> = {
  neutral: 'bg-light-grey',
  sage: 'bg-light-sage',
  gold: 'bg-pale-gold',
  glicine: 'bg-pale-glicine',
  peach: 'bg-pale-peach',
  salmon: 'bg-salmon',
  bubble: 'bg-pale-bubble',
}

export interface SelectableTagProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  label: string
  selected: boolean
  onChange: (selected: boolean) => void
  color?: Exclude<TagColor, 'plain'>
}

export function SelectableTag({ label, selected, onChange, color = 'neutral', className, ...rest }: SelectableTagProps) {
  const Icon = selected ? Check : Plus
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onChange(!selected)}
      className={clsx(
        'relative inline-flex h-[32px] cursor-pointer items-center gap-s rounded-small border pr-m pl-s text-label whitespace-nowrap',
        'transition-colors duration-150 active:scale-[0.97] motion-reduce:active:scale-100',
        'after:absolute after:-inset-y-[6px] after:inset-x-0 after:content-[""]',
        'outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-sage',
        selected ? clsx(onColors[color], 'border-transparent text-dark-grey') : 'border-soft-grey bg-surface text-medium-grey hover:bg-light-grey',
        className,
      )}
      {...rest}
    >
      <Icon size={16} strokeWidth={1} absoluteStrokeWidth aria-hidden />
      {label}
    </button>
  )
}
