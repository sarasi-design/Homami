import { useState } from 'react'
import { ChartColumn, CircleHelp, LogOut, Menu } from 'lucide-react'
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
  /** Opens the Homami team page; only for the team */
  onTeam?: () => void
}

export function AppMenu({ onLogOut, onHelp, onTeam }: AppMenuProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <IconButton icon={Menu} label="Menu" onClick={() => setOpen(true)} aria-haspopup="dialog" />
      <ActionSheet open={open} onClose={() => setOpen(false)} label="Menu" actions={[...(onHelp ? [{ label: 'Find out more', icon: CircleHelp, onSelect: onHelp }] : []), ...(onTeam ? [{ label: 'Homami team', icon: ChartColumn, onSelect: onTeam }] : []), { label: 'Log out', icon: LogOut, onSelect: onLogOut }]} />
    </>
  )
}
