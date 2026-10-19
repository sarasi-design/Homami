import { useState } from 'react'
import { LogOut, Menu } from 'lucide-react'
import { IconButton } from '../basics/Button'
import { ActionSheet } from './ActionSheet'

/**
 * AppMenu — the ≡ button on the right of the header, on every main page (Home, Circle, Your profile).
 * Tapping it opens an Action sheet with Log out (more items can join it later, e.g. Settings).
 */
export interface AppMenuProps {
  onLogOut: () => void
}

export function AppMenu({ onLogOut }: AppMenuProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <IconButton icon={Menu} label="Menu" onClick={() => setOpen(true)} aria-haspopup="dialog" />
      <ActionSheet open={open} onClose={() => setOpen(false)} label="Menu" actions={[{ label: 'Log out', icon: LogOut, onSelect: onLogOut }]} />
    </>
  )
}
