import { useState } from 'react'
import { CircleHelp, LogOut, Menu } from 'lucide-react'
import { IconButton } from '../basics/Button'
import { ActionSheet } from './ActionSheet'

/**
 * AppMenu — the ≡ button on the right of the header, on every main page (Home, Circle, Your profile).
 * Tapping it opens an Action sheet with Find out more (how Homami works, Nov 12) and Log out.
 */
export interface AppMenuProps {
  onLogOut: () => void
  /** Opens Find out more; without it, only Log out */
  onHelp?: () => void
}

export function AppMenu({ onLogOut, onHelp }: AppMenuProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <IconButton icon={Menu} label="Menu" onClick={() => setOpen(true)} aria-haspopup="dialog" />
      <ActionSheet open={open} onClose={() => setOpen(false)} label="Menu" actions={[...(onHelp ? [{ label: 'Find out more', icon: CircleHelp, onSelect: onHelp }] : []), { label: 'Log out', icon: LogOut, onSelect: onLogOut }]} />
    </>
  )
}
