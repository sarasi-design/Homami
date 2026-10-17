import { useRef } from 'react'
import type { KeyboardEvent } from 'react'
import clsx from 'clsx'

/**
 * Tabs — Figma "Tabs" (15:1571) and "Tab" (18:2026).
 * Active tab sits on a Light grey pill; others are plain text. All Body Bold, 36px tall.
 * Keyboard: arrow keys move between tabs (standard tablist behaviour).
 * Tabs only switch the view; the content underneath is up to the screen.
 */
export interface TabItem {
  id: string
  label: string
}

export interface TabsProps {
  tabs: TabItem[]
  value: string
  onChange: (id: string) => void
  /** Read out by screen readers, e.g. "Profile sections" */
  label: string
  className?: string
}

export function Tabs({ tabs, value, onChange, label, className }: TabsProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const onKeyDown = (e: KeyboardEvent, i: number) => {
    let next = -1
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length
    if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = tabs.length - 1
    if (next >= 0) {
      e.preventDefault()
      refs.current[next]?.focus()
      onChange(tabs[next].id)
    }
  }
  return (
    <div role="tablist" aria-label={label} className={clsx('flex items-center gap-l', className)}>
      {tabs.map((t, i) => {
        const active = t.id === value
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            role="tab"
            type="button"
            id={`tab-${t.id}`}
            aria-selected={active}
            aria-controls={`panel-${t.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={clsx(
              'h-[36px] whitespace-nowrap rounded-pill px-m text-body-bold text-dark-grey cursor-pointer transition-colors duration-150',
              active ? 'bg-light-grey' : 'hover:bg-light-grey/60 active:bg-light-grey',
              'outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-sage',
            )}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
