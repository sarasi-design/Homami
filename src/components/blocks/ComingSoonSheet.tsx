import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '../basics/Button'
import { Sheet } from './Sheet'

/**
 * ComingSoonSheet — slides up when someone picks something that isn't ready yet ("Stay in exchange for care",
 * Sara, Nov 14, 2026). Built on Sheet: a round icon in Light sage, the name of the feature (Title),
 * one or two lines in Body grey saying it's coming and that their interest was counted, and "Got it".
 * Nothing gets picked: the option stays off. Tapping outside or pressing Esc closes it too.
 */
export interface ComingSoonSheetProps {
  open: boolean
  onClose: () => void
  icon: LucideIcon
  /** e.g. "Stay in exchange for care" */
  feature: string
  /** Defaults to the general "we're working on it" text */
  children?: ReactNode
}

export function ComingSoonSheet({ open, onClose, icon: Icon, feature, children }: ComingSoonSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} label={`${feature}: coming soon`}>
      <div className="flex flex-col items-center gap-m px-l pt-xl pb-xl text-center">
        <span aria-hidden className="flex size-[56px] items-center justify-center rounded-full bg-light-sage text-primary-sage">
          <Icon size={28} strokeWidth={1} absoluteStrokeWidth />
        </span>
        <div className="flex flex-col gap-xs">
          <p className="text-overline text-medium-grey">Coming soon</p>
          <h2 className="text-title text-dark-grey">{feature}</h2>
        </div>
        <div className="max-w-[320px] text-body text-medium-grey">
          {children ?? 'It isn’t ready yet. We’ve noted that you’d like it: it helps us decide what to build next.'}
        </div>
        <Button autoFocus variant="neutral" fullWidth onClick={onClose} className="mt-s">
          Got it
        </Button>
      </div>
    </Sheet>
  )
}
