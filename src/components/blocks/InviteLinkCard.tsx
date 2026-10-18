import { useState } from 'react'
import { Check, Copy, Share2 } from 'lucide-react'
import { Button } from '../basics/Button'
import { TextInput } from '../basics/TextInput'

/**
 * InviteLinkCard — Figma "YOUR INVITE LINK" card on Invite friends (250:128185):
 * Overline, the link in a read-only Text input, then Copy (Small, Neutral) and Share (Small, Outline).
 * Share opens the phone's share sheet (WhatsApp, Messages…); where that isn't available it copies instead.
 */
export interface InviteLinkCardProps {
  link: string
  /** The message that goes with the link when sharing */
  shareText?: string
}

export function InviteLinkCard({ link, shareText = 'Join my circle on Homami, so we can help each other with our pets' }: InviteLinkCardProps) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // If copying isn't allowed, select the text so it can be copied by hand
      const field = document.getElementById('invite-link') as HTMLInputElement | null
      field?.select()
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Homami', text: shareText, url: link })
      } catch {
        // closing the share sheet is fine
      }
    } else {
      copy()
    }
  }

  return (
    <section className="flex flex-col gap-l rounded-card border border-light-grey p-l">
      <h2 className="text-overline text-dark-grey">Your invite link</h2>
      <TextInput id="invite-link" label="Your invite link" hideLabel readOnly value={link.replace(/^https?:\/\//, '')} onFocus={(e) => e.target.select()} />
      <div className="flex gap-s" aria-live="polite">
        <Button variant="neutral" size="small" iconLeft={copied ? Check : Copy} onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
        <Button variant="outline" size="small" iconRight={Share2} onClick={share}>
          Share
        </Button>
      </div>
    </section>
  )
}
