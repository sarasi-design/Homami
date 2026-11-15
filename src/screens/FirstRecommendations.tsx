import { Button } from '../components/basics/Button'
import { Header } from '../components/blocks/Header'
import { InviteLinkCard } from '../components/blocks/InviteLinkCard'
import { Steps } from '../components/blocks/Steps'
import { Note } from '../components/basics/Note'
import { sitterShareText } from '../lib/recommendations'

/**
 * Get your first recommendations — right after a pet sitter finishes their sitter profile, at sign-up or later
 * (Sara, Nov 15, 2026; the "Share" step of Figma Chat+book 140:6880). Their own link, ready to send with a short
 * message (WhatsApp, Messages…), and how it works. Built from Header, InviteLinkCard and Steps.
 */
export interface FirstRecommendationsProps {
  name: string
  /** The sitter's own link; null before database script 20 */
  link: string | null
  onDone: () => void
}

export function FirstRecommendations({ name, link, onDone }: FirstRecommendationsProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
      <Header title="Your first recommendations" />
      <div className="flex flex-1 flex-col gap-xl px-l pt-s pb-[40px]">
        <div className="flex flex-col gap-s">
          <h1 className="text-title text-dark-grey">Ask your clients to recommend you</h1>
          <p className="text-label-light text-dark-grey">
            People choose sitters their friends already trust. Send your page to the people whose pets you’ve looked after: one recommendation makes a big difference.
          </p>
        </div>
        {link ? (
          <InviteLinkCard title="Your page link" link={link} shareText={sitterShareText(name)} />
        ) : (
          <Note title="Your link is almost ready">Homami’s database needs an update first (setup script 20). You’ll find your link on Your profile afterwards.</Note>
        )}
        <Steps
          title="How it works"
          steps={[
            'Your clients open your page. No account or invitation needed',
            'They sign up in a minute and recommend you, with a short note',
            'Their friends see “Recommended by…” on your profile and get in touch',
          ]}
        />
        <Button variant="neutral" fullWidth onClick={onDone}>
          Done
        </Button>
      </div>
    </main>
  )
}
