import { useEffect } from 'react'
import type { ReactNode } from 'react'

/**
 * Sheet — a panel that slides up over the page (dimmed behind), for short tasks you do without
 * leaving the page, e.g. writing a post from the wall. White, 12px top corners, up to 92% of the
 * screen height; scrolls inside if needed. Tapping outside or pressing Esc closes it.
 * Put its own title and close button inside (see New post).
 */
export interface SheetProps {
  open: boolean
  onClose: () => void
  /** Read out by screen readers, e.g. "New post" */
  label: string
  children: ReactNode
}

export function Sheet({ open, onClose, label, children }: SheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const before = document.body.style.overflow
    document.body.style.overflow = 'hidden' // the page behind doesn't scroll
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = before
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="absolute inset-0 cursor-default bg-dark-grey/40" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="relative flex max-h-[92dvh] w-full max-w-[480px] flex-col overflow-y-auto rounded-t-card bg-surface pb-[env(safe-area-inset-bottom)] motion-safe:animate-[sheet-up_200ms_ease-out]"
      >
        {children}
      </div>
    </div>
  )
}
