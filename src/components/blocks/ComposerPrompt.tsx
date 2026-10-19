import { Avatar } from '../basics/Avatar'

/**
 * ComposerPrompt — the "What's new?" line at the top of the wall.
 * Your Avatar (medium) next to a pill that looks like a text field; tapping the pill opens New post.
 * Pass onOpenProfile to make the avatar open Your profile, or showAvatar={false} when the header
 * right above already shows it (Home).
 * (Not in Figma yet — built from Avatar and the Text input look.)
 */
export interface ComposerPromptProps {
  name: string
  photoUrl?: string | null
  prompt?: string
  onOpen: () => void
  /** Makes your avatar a button to Your profile */
  onOpenProfile?: () => void
  /** Hide your avatar when it's already in the header right above */
  showAvatar?: boolean
}

export function ComposerPrompt({ name, photoUrl, prompt = 'What’s new?', onOpen, onOpenProfile, showAvatar = true }: ComposerPromptProps) {
  const avatar = <Avatar size="medium" name={name} src={photoUrl ?? undefined} />
  return (
    <div className="flex items-center gap-m">
      {!showAvatar ? null : onOpenProfile ? (
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
