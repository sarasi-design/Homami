import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '../basics/Button'
import type { ButtonSize } from '../basics/Button'

/**
 * ConfirmAction — a ghost Button for things that can't be undone (Delete a post, Remove a pet).
 * The first tap swaps it for "Yes, …" (in red) and "Cancel" in the same spot, so nothing pops up
 * and nobody deletes by accident. While it works, the red button says e.g. "Deleting…".
 */
export interface ConfirmActionProps {
  /** e.g. "Delete" */
  label: string
  icon?: LucideIcon
  /** e.g. "Yes, delete" */
  confirmLabel: string
  /** e.g. "Deleting…" */
  busyLabel: string
  onConfirm: () => Promise<void> | void
  size?: ButtonSize
}

export function ConfirmAction({ label, icon, confirmLabel, busyLabel, onConfirm, size = 'xsmall' }: ConfirmActionProps) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!confirming) {
    return (
      <Button variant="ghost" size={size} iconLeft={icon} onClick={() => setConfirming(true)}>
        {label}
      </Button>
    )
  }

  return (
    <span className="flex items-center gap-xs">
      <Button
        variant="ghost"
        size={size}
        className="text-error"
        disabled={busy}
        aria-busy={busy || undefined}
        onClick={async () => {
          setBusy(true)
          try {
            await onConfirm()
          } finally {
            setBusy(false)
            setConfirming(false)
          }
        }}
      >
        {busy ? busyLabel : confirmLabel}
      </Button>
      <Button variant="ghost" size={size} onClick={() => setConfirming(false)} disabled={busy}>
        Cancel
      </Button>
    </span>
  )
}
