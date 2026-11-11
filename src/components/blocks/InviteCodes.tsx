import { useState } from 'react'
import { Check, Copy, Plus, Share2, Trash2 } from 'lucide-react'
import { Button, IconButton } from '../basics/Button'
import { Tag } from '../basics/Tag'
import { shareInvite, useCopy } from '../../lib/share'

/**
 * InviteCodes — "Invite friends" on Your profile (Sara, Nov 11; not in Figma yet, built from Button, IconButton and Tag).
 * "Create an invite code" makes a code for one person: it works once, for 30 days, and puts them in your circle.
 * Each code shows big, with Copy code, Share (the link with the code) and Delete while nobody has used it.
 * Used and expired codes stay in the list, greyed, so you can see what happened to them.
 *   codes        your codes, newest first; undefined while loading
 *   onCreate     makes a new code (the list reloads)
 *   onRemove     deletes a code nobody has used
 *   linkFor      the invite link for a code
 *   error        e.g. database script 12 hasn't been run yet
 */
export interface InviteCodeItem {
  code: string
  uses: number
  expires_at: string
}

export interface InviteCodesProps {
  codes: InviteCodeItem[] | undefined
  onCreate: () => Promise<void> | void
  onRemove: (code: string) => Promise<void> | void
  linkFor: (code: string) => string
  error?: string | null
  /** Fixed "now" for stories */
  now?: Date
}

const dayMonth = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

export function InviteCodes({ codes, onCreate, onRemove, linkFor, error, now: fixedNow }: InviteCodesProps) {
  const [openedAt] = useState(() => new Date())
  const now = fixedNow ?? openedAt
  const { copied, copy } = useCopy()
  const [creating, setCreating] = useState(false)

  async function create() {
    setCreating(true)
    try {
      await onCreate()
    } finally {
      setCreating(false)
    }
  }

  return (
    <section className="flex flex-col gap-m">
      <div className="flex flex-col gap-xs">
        <h2 className="text-body text-dark-grey">Invite friends</h2>
        <p className="text-label-light text-medium-grey">Make a code for a friend. It works once, for 30 days, and adds them to your circle.</p>
      </div>
      <Button variant="dark" size="small" iconLeft={Plus} onClick={create} disabled={creating} aria-busy={creating || undefined}>
        {creating ? 'Creating…' : 'Create an invite code'}
      </Button>
      {error && (
        <p role="alert" className="text-label text-error">
          {error}
        </p>
      )}
      {codes && codes.length > 0 && (
        <ul className="flex flex-col gap-s" aria-live="polite">
          {codes.map((c) => {
            const used = c.uses > 0
            const expired = !used && new Date(c.expires_at) <= now
            const open = !used && !expired
            return (
              <li key={c.code} className="flex flex-col gap-s rounded-card border border-light-grey p-m">
                <div className="flex items-center justify-between gap-s">
                  <span className={open ? 'text-title tracking-[0.08em] text-dark-grey' : 'text-title tracking-[0.08em] text-medium-grey'}>
                    {c.code}
                  </span>
                  {open ? (
                    <IconButton icon={Trash2} label={`Delete code ${c.code}`} size="xsmall" onClick={() => onRemove(c.code)} />
                  ) : (
                    <Tag color={used ? 'sage' : 'neutral'} size="small">
                      {used ? 'Used' : 'Expired'}
                    </Tag>
                  )}
                </div>
                {open && (
                  <>
                    <p className="text-caption text-medium-grey">Not used yet · works until {dayMonth(c.expires_at)}</p>
                    <div className="flex flex-wrap gap-s">
                      <Button variant="neutral" size="xsmall" iconLeft={copied === c.code ? Check : Copy} onClick={() => copy(c.code)}>
                        {copied === c.code ? 'Copied' : 'Copy code'}
                      </Button>
                      <Button
                        variant="outline"
                        size="xsmall"
                        iconRight={Share2}
                        onClick={() =>
                          shareInvite(`Join my circle on Homami, so we can help each other with our pets. Your invite code is ${c.code}`, linkFor(c.code), (t) => copy(t, `share-${c.code}`))
                        }
                      >
                        Share
                      </Button>
                    </div>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
