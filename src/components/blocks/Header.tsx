import { ArrowLeft } from 'lucide-react'
import { IconButton } from '../basics/Button'

/**
 * Header — Figma "Header / Status=Minimal" (3:417): 80px tall, an optional round back button
 * on the left and the page title on the right in Dark sage.
 */
export interface HeaderProps {
  title: string
  /** Shows the back arrow when set */
  onBack?: () => void
  backLabel?: string
}

export function Header({ title, onBack, backLabel = 'Back' }: HeaderProps) {
  return (
    <header className="flex h-[80px] shrink-0 items-center justify-between gap-s px-l pt-xl pb-m">
      {onBack ? <IconButton icon={ArrowLeft} label={backLabel} onClick={onBack} /> : <span aria-hidden />}
      <h1 className="pr-m text-title text-dark-sage">{title}</h1>
    </header>
  )
}
