import { Check, Copy, Share2 } from 'lucide-react'
import { Button } from '../basics/Button'
import { TextInput } from '../basics/TextInput'
import { shareInvite, useCopy } from '../../lib/share'

/**
 * InviteLinkCard — Figma "YOUR INVITE LINK" card on Invite friends (250:128185):
 * Overline, the link in a read-only Text input, then Copy (Small, Neutral) and Share (Small, Outline).
 * Share opens the phone's share sheet (WhatsApp, Messages…); where that isn't available it copies instead.
 * With `code` (Sara, Nov 11): the code itself comes first, big, with "Copy code", because that's what friends
 * type when they sign up; the full link sits below with its own "Copy link".
 * `title` (Nov 15): the same card for a pet sitter's own link ("Your page link").
 */
export interface InviteLinkCardProps {
  link: string
  /** Your personal invite code (the end of the link). Shown big, with "Copy code". */
  code?: string
  /** The message that goes with the link when sharing */
  shareText?: string
  /** The overline, e.g. "Your page link" for a pet sitter's own link (default "Your invite link") */
  title?: string
}

export function InviteLinkCard({ link, code, shareText = 'Join me on Homami, where we find pet sitters our friends already trust and recommend our own', title = 'Your invite link' }: InviteLinkCardProps) {
  const { copied, copy } = useCopy('invite-link')
  const share = () => shareInvite(code ? `${shareText}. My invite code is ${code}` : shareText, link, (t) => copy(t, 'share'))

  if (!code) {
    return (
      <section className="flex flex-col gap-l rounded-card border border-light-grey p-l">
        <h2 className="text-overline text-dark-grey">{title}</h2>
        <TextInput id="invite-link" label={title} hideLabel readOnly value={link.replace(/^https?:\/\//, '')} onFocus={(e) => e.target.select()} />
        <div className="flex gap-s" aria-live="polite">
          <Button variant="neutral" size="small" iconLeft={copied ? Check : Copy} onClick={() => copy(link)}>
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button variant="outline" size="small" iconRight={Share2} onClick={share}>
            Share
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-l rounded-card border border-light-grey p-l">
      <div className="flex flex-col gap-s">
        <h2 className="text-overline text-dark-grey">Your invite code</h2>
        <p className="text-title tracking-[0.08em] text-dark-grey">{code}</p>
        <p className="text-caption text-medium-grey">Friends type it when they sign up. Opening your link fills it in for them.</p>
      </div>
      <div className="flex flex-wrap gap-s" aria-live="polite">
        <Button variant="neutral" size="small" iconLeft={copied === 'code' ? Check : Copy} onClick={() => copy(code, 'code')}>
          {copied === 'code' ? 'Copied' : 'Copy code'}
        </Button>
        <Button variant="outline" size="small" iconRight={Share2} onClick={share}>
          Share
        </Button>
      </div>
      <div className="flex flex-col gap-s">
        <TextInput id="invite-link" label="Your invite link" readOnly value={link.replace(/^https?:\/\//, '')} onFocus={(e) => e.target.select()} />
        <Button variant="ghost" size="xsmall" iconLeft={copied === 'link' ? Check : Copy} onClick={() => copy(link, 'link')}>
          {copied === 'link' ? 'Copied' : 'Copy link'}
        </Button>
      </div>
    </section>
  )
}
