import { useEffect, useRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'

/**
 * ActionSheet — a small menu that slides up from the bottom of the screen, for actions that
 * shouldn't sit on the page all the time (e.g. Log out, behind the ≡ menu in the header (App menu)).
 * White panel with 12px top corners over a dimmed page; each action is a 52px row with a 1px icon;
 * Cancel at the bottom. Tapping outside or pressing Esc closes it.
 */
export interface SheetAction {
  label: string
  icon?: LucideIcon
  onSelect: () => void
  /** Red text, for actions like Delete */
  danger?: boolean
}

export interface ActionSheetProps {
  open: boolean
  onClose: () => void
  /** Read out by screen readers, e.g. "Profile menu" */
  label: string
  actions: SheetAction[]
}

export function ActionSheet({ open, onClose, label, actions }: ActionSheetProps) {
  const firstRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    firstRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const row =
    'flex h-[52px] w-full cursor-pointer items-center gap-m rounded-small px-l text-left text-body transition-colors duration-150 ' +
    'hover:bg-light-grey active:bg-light-grey outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-sage'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button type="button" aria-label="Close menu" tabIndex={-1} onClick={onClose} className="absolute inset-0 cursor-default bg-dark-grey/40" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="relative w-full max-w-[480px] rounded-t-card bg-surface px-s pt-s pb-[max(16px,env(safe-area-inset-bottom))] motion-safe:animate-[sheet-up_180ms_ease-out]"
      >
        <ul className="flex flex-col">
          {actions.map((a, i) => (
            <li key={a.label}>
              <button
                ref={i === 0 ? firstRef : undefined}
                type="button"
                onClick={() => {
                  onClose()
                  a.onSelect()
                }}
                className={clsx(row, a.danger ? 'text-error' : 'text-dark-grey')}
              >
                {a.icon && <a.icon size={24} strokeWidth={1} absoluteStrokeWidth aria-hidden />}
                {a.label}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-s border-t border-soft-grey pt-s">
          <button type="button" onClick={onClose} className={clsx(row, 'justify-center text-body-bold text-dark-grey')}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
