import clsx from 'clsx'

/**
 * FilterChips — a row of pill buttons to narrow what a list shows, used on the fly
 * (e.g. the wall: All · Circle · Extended circle · Sitters). Pick one at a time.
 *   off — white, Soft grey border, Dark grey text
 *   on  — Dark grey fill, white text
 * 36px tall (tap area extended to 44px). The row scrolls sideways if it doesn't fit.
 */
export interface FilterOption {
  id: string
  label: string
}

export interface FilterChipsProps {
  options: FilterOption[]
  value: string
  onChange: (id: string) => void
  /** Read out by screen readers, e.g. "Show on your wall" */
  label: string
}

export function FilterChips({ options, value, onChange, label }: FilterChipsProps) {
  return (
    <div role="radiogroup" aria-label={label} className="-mx-l flex gap-s overflow-x-auto px-l py-xs [scrollbar-width:none]">
      {options.map((o) => {
        const on = o.id === value
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.id)}
            className={clsx(
              'relative h-[36px] shrink-0 cursor-pointer rounded-pill border px-m text-label whitespace-nowrap transition-colors duration-150',
              'after:absolute after:-inset-y-[4px] after:inset-x-0 after:content-[""]',
              'outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-sage',
              on ? 'border-dark-grey bg-dark-grey text-surface' : 'border-soft-grey bg-surface text-dark-grey hover:bg-light-grey',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
