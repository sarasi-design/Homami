import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { IconButton } from '../basics/Button'
import { Avatar } from '../basics/Avatar'

/**
 * Header — Figma "Header" (3:417), 80px tall.
 *   Minimal: an optional round back button on the left and the page title on the right in Dark sage.
 *   Default (main pages): your photo on the left (opens your profile). Pass `me` for this one.
 *   `actions`: icon buttons on the far right, after the title (e.g. the ≡ menu on Your profile).
 * Sticky: it stays at the top while the page scrolls underneath (white background).
 */
export interface HeaderProps {
  title?: string
  /** Main pages: your photo on the left, opening your profile */
  me?: { name: string; photoUrl?: string | null; onOpen: () => void }
  /** Shows the back arrow when set */
  onBack?: () => void
  backLabel?: string
  /** Icon buttons on the right, e.g. <IconButton icon={Menu} label="Menu" /> */
  actions?: ReactNode
}

export function Header({ title, me, onBack, backLabel = 'Back', actions }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-[80px] shrink-0 items-center justify-between gap-s bg-surface px-l pt-xl pb-m">
      {me ? (
        <button
          type="button"
          onClick={me.onOpen}
          aria-label="Your profile"
          className="cursor-pointer rounded-pill outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-sage"
        >
          <Avatar size="medium" name={me.name} src={me.photoUrl ?? undefined} />
        </button>
      ) : onBack ? (
        <IconButton icon={ArrowLeft} label={backLabel} onClick={onBack} />
      ) : (
        <span aria-hidden />
      )}
      {(title || actions) && (
        <div className="flex items-center gap-s">
          {title && <h1 className={actions ? 'text-title text-dark-sage' : 'pr-m text-title text-dark-sage'}>{title}</h1>}
          {actions}
        </div>
      )}
    </header>
  )
}
