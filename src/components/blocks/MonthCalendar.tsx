import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import { IconButton } from '../basics/Button'

/**
 * MonthCalendar — Figma "Availability calendar" (as on Set up pet sitter profile, 85:10709):
 * a card (12px corners, Soft grey border) with the month, < > to move between months,
 * the weekday letters and the days. Pick one day; tap it again to clear it.
 * Days before today can't be picked. The chosen day is a Primary sage circle with white text;
 * today has a Soft grey ring.
 * Value is a 'YYYY-MM-DD' string (or null).
 */
export interface MonthCalendarProps {
  value: string | null
  onChange: (date: string | null) => void
  /** Read out before the month, e.g. "Available from" */
  label: string
}

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function MonthCalendar({ value, onChange, label }: MonthCalendarProps) {
  const [now] = useState(() => new Date())
  const todayIso = iso(now.getFullYear(), now.getMonth(), now.getDate())
  const start = value ? new Date(`${value}T12:00:00`) : now
  const [view, setView] = useState({ y: start.getFullYear(), m: start.getMonth() })

  const first = new Date(view.y, view.m, 1)
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
  const blanks = first.getDay()
  const monthName = first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const isCurrentMonth = view.y === now.getFullYear() && view.m === now.getMonth()

  const move = (delta: number) => {
    const d = new Date(view.y, view.m + delta, 1)
    setView({ y: d.getFullYear(), m: d.getMonth() })
  }

  return (
    <div className="flex flex-col gap-m rounded-card border border-soft-grey p-l" role="group" aria-label={`${label}: ${monthName}`}>
      <div className="flex items-center justify-between">
        <IconButton icon={ChevronLeft} label="Previous month" size="small" onClick={() => move(-1)} disabled={isCurrentMonth} />
        <p className="text-label-bold text-dark-grey" aria-live="polite">
          {monthName}
        </p>
        <IconButton icon={ChevronRight} label="Next month" size="small" onClick={() => move(1)} />
      </div>
      <div className="grid grid-cols-7 gap-y-xs text-center">
        {WEEKDAYS.map((d) => (
          <span key={d} aria-hidden className="pb-xs text-caption text-medium-grey uppercase">
            {d}
          </span>
        ))}
        {Array.from({ length: blanks }, (_, i) => (
          <span key={`b${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const date = iso(view.y, view.m, day)
          const selected = date === value
          const past = date < todayIso
          return (
            <span key={date} className="flex justify-center">
              <button
                type="button"
                disabled={past}
                aria-pressed={selected}
                aria-label={new Date(view.y, view.m, day).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                onClick={() => onChange(selected ? null : date)}
                className={clsx(
                  'flex size-[40px] cursor-pointer items-center justify-center rounded-pill text-label transition-colors duration-150',
                  'outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-primary-sage',
                  selected ? 'bg-primary-sage text-surface' : 'text-dark-grey hover:bg-light-grey',
                  !selected && date === todayIso && 'shadow-[inset_0_0_0_1px_var(--color-soft-grey)]',
                  'disabled:cursor-default disabled:text-soft-grey disabled:hover:bg-transparent',
                )}
              >
                {day}
              </button>
            </span>
          )
        })}
      </div>
    </div>
  )
}
