import { Avatar } from '../basics/Avatar'

/**
 * ComposerPrompt — the "What's new with your pets?" line at the top of the wall.
 * Your Avatar (medium) next to a pill that looks like a text field; tapping it opens New post.
 * (Not in Figma yet — built from Avatar and the Text input look.)
 */
export function ComposerPrompt({ name, photoUrl, prompt = 'What’s new with your pets?', onOpen }: { name: string; photoUrl?: string | null; prompt?: string; onOpen: () => void }) {
  return (
    <div className="flex items-center gap-m">
      <Avatar size="medium" name={name} src={photoUrl ?? undefined} />
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
