import { Avatar } from '../basics/Avatar'

/**
 * ComposerPrompt — the "What's new with your pets?" line at the top of the wall.
 * Your Avatar (medium) next to a pill that looks like a text field; tapping the pill opens New post.
 * On Home it also replaces the header: tapping your avatar opens Your profile (pass onOpenProfile).
 * (Not in Figma yet — built from Avatar and the Text input look.)
 */
export interface ComposerPromptProps {
  name: string
  photoUrl?: string | null
  prompt?: string
  onOpen: () => void
  /** Makes your avatar a button to Your profile */
  onOpenProfile?: () => void
}

export function ComposerPrompt({ name, photoUrl, prompt = 'What’s new with your pets?', onOpen, onOpenProfile }: ComposerPromptProps) {
  const avatar = <Avatar size="medium" name={name} src={photoUrl ?? undefined} />
  return (
    <div className="flex items-center gap-m">
      {onOpenProfile ? (
        <button
          type="button"
          onClick={onOpenProfile}
          aria-label="Your profile"
          className="shrink-0 cursor-pointer rounded-pill outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-sage"
        >
          {avatar}
        </button>
      ) : (
        avatar
      )}
      <button
        type="button"
        onClick={onOpen}
        className="flex h-[44px] flex-1 cursor-pointer items-center rounded-pill border border-soft-grey bg-surface px-l text-left text-[16px] text-medium-grey transition-colors hover:bg-light-grey/50 outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-sage"
      >
        {prompt}
      </button>
    </div>
  )
}
