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
 *
 * Range mode (Create a request, Figma 85:10678 / 90:6520): pick a first and a last day.
 *   First tap = first day. Second tap on a later day (or the same day) = last day.
 *   Tapping before the first day starts again from there; a tap once both are set starts a new range.
 *   First and last days are Primary sage circles; the days between are Light sage circles.
 */
interface CommonProps {
  /** Read out before the month, e.g. "Available from" */
  label: string
}
interface SingleProps extends CommonProps {
  mode?: 'single'
  value: string | null
  onChange: (date: string | null) => void
}
interface RangeProps extends CommonProps {
  mode: 'range'
  start: string | null
  end: string | null
  onRangeChange: (start: string | null, end: string | null) => void
}
export type MonthCalendarProps = SingleProps | RangeProps

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function MonthCalendar(props: MonthCalendarProps) {
  const { label } = props
  const isRange = props.mode === 'range'
  const value = isRange ? null : props.value
  const rangeStart = isRange ? props.start : null
  const rangeEnd = isRange ? props.end : null
  const [now] = useState(() => new Date())
  const todayIso = iso(now.getFullYear(), now.getMonth(), now.getDate())
  const shownFirst = isRange ? rangeStart : value
  const start = shownFirst ? new Date(`${shownFirst}T12:00:00`) : now
  const [view, setView] = useState({ y: start.getFullYear(), m: start.getMonth() })

  const pick = (date: string) => {
    if (props.mode !== 'range') return props.onChange(date === value ? null : date)
    if (!rangeStart || rangeEnd) return props.onRangeChange(date, null)
    if (date < rangeStart) return props.onRangeChange(date, null)
    props.onRangeChange(rangeStart, date)
  }

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
          const edge = isRange ? date === rangeStart || date === rangeEnd : date === value
          const between = isRange && !!rangeStart && !!rangeEnd && date > rangeStart && date < rangeEnd
          const selected = edge || between
          const past = date < todayIso
          return (
            <span key={date} className="flex justify-center">
              <button
                type="button"
                disabled={past}
                aria-pressed={selected}
                aria-label={new Date(view.y, view.m, day).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                onClick={() => pick(date)}
                className={clsx(
                  'flex size-[40px] cursor-pointer items-center justify-center rounded-pill text-label transition-colors duration-150',
                  'outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-primary-sage',
                  edge ? 'bg-primary-sage text-surface' : between ? 'bg-light-sage text-dark-grey' : 'text-dark-grey hover:bg-light-grey',
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
