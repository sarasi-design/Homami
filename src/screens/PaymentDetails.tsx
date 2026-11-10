import { useState } from 'react'
import { CreditCard, Landmark, Trash2 } from 'lucide-react'
import { Button } from '../components/basics/Button'
import { DetailRow } from '../components/basics/DetailRow'
import { Note } from '../components/basics/Note'
import { Tag } from '../components/basics/Tag'
import { CardForm } from '../components/blocks/CardForm'
import { ConfirmAction } from '../components/blocks/ConfirmAction'
import { Header } from '../components/blocks/Header'
import { FormError } from './WelcomeLayout'
import { cardLabel } from '../lib/payments'
import type { PaymentProfile } from '../lib/payments'

/**
 * Payment details — from Your profile. Not in Figma yet beyond "Set up payment details" in the flows
 * (82:5047), so it's built from the same parts as Your profile: section titles in Body, cards with a
 * Soft grey border, DetailRows.
 *   Your card      for paying pet sitters: "Visa •••• 4242 · expires 12/28" with Change / Remove,
 *                  or "Add a card" (CardForm: Stripe's own card fields)
 *   Getting paid   only if you offer pet sitting: Stripe's page for your bank details ("Set up payouts"),
 *                  then "Ready to be paid". Homami never sees bank details.
 * Nothing is charged here: owners pay when a sitter accepts their booking.
 */
export interface PaymentDetailsProps {
  /** undefined while loading */
  profile: PaymentProfile | null | undefined
  /** Do you offer pet sitting? Shows Getting paid */
  isSitter: boolean
  /** false when the Stripe key isn't in .env yet */
  configured: boolean
  /** A problem loading (e.g. database script 11 not run yet) */
  loadError?: string | null
  onCardSaved: () => void
  onRemoveCard: () => Promise<void>
  /** Opens Stripe's payout setup page */
  onSetUpPayouts: () => Promise<void>
  onBack: () => void
}

export function PaymentDetails({ profile, isSitter, configured, loadError, onCardSaved, onRemoveCard, onSetUpPayouts, onBack }: PaymentDetailsProps) {
  const [addingCard, setAddingCard] = useState(false)
  const [opening, setOpening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const card = profile ? cardLabel(profile) : null

  async function setUpPayouts() {
    setOpening(true)
    setError(null)
    try {
      await onSetUpPayouts() // leaves for Stripe's page
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setOpening(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
      <Header title="Payment details" onBack={onBack} />
      <div className="flex flex-1 flex-col gap-xl px-l pt-s pb-[40px]">
        {!configured ? (
          <Note title="Payments aren’t set up yet">Homami needs its Stripe key before cards can be added. Please try again later.</Note>
        ) : loadError ? (
          <FormError>{loadError}</FormError>
        ) : profile === undefined ? null : (
          <>
            <section className="flex flex-col gap-m">
              <h2 className="text-body text-dark-grey">Your card</h2>
              <p className="text-label text-medium-grey">For paying pet sitters. You’re only charged when a sitter accepts your booking.</p>
              {addingCard ? (
                <CardForm
                  onSaved={() => {
                    setAddingCard(false)
                    onCardSaved()
                  }}
                  onCancel={() => setAddingCard(false)}
                />
              ) : card ? (
                <div className="flex flex-col gap-m rounded-card border border-soft-grey p-l">
                  <DetailRow icon={CreditCard} size="medium">
                    <strong>{card}</strong>
                    {profile?.card_exp && <> · expires {profile.card_exp}</>}
                  </DetailRow>
                  <div className="flex flex-wrap items-center gap-m">
                    <Button variant="outline" size="xsmall" onClick={() => setAddingCard(true)}>
                      Change card
                    </Button>
                    <ConfirmAction
                      icon={Trash2}
                      label="Remove"
                      confirmLabel="Yes, remove"
                      busyLabel="Removing…"
                      onConfirm={async () => {
                        setError(null)
                        try {
                          await onRemoveCard()
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
                        }
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex rounded-card border border-dashed border-soft-grey p-l">
                  <Button variant="neutral" size="small" iconLeft={CreditCard} onClick={() => setAddingCard(true)}>
                    Add a card
                  </Button>
                </div>
              )}
            </section>

            {isSitter && (
              <section className="flex flex-col gap-m">
                <h2 className="text-body text-dark-grey">Getting paid</h2>
                <p className="text-label text-medium-grey">
                  For your paid services. Stripe looks after your bank details and sends you the money; Homami never sees them.
                </p>
                <div className="flex flex-col gap-m rounded-card border border-soft-grey p-l">
                  <div className="flex items-center justify-between gap-m">
                    <DetailRow icon={Landmark} size="medium">
                      <strong>Payouts</strong>
                    </DetailRow>
                    {profile?.payouts_ready ? (
                      <Tag size="small" color="sage">
                        Ready to be paid
                      </Tag>
                    ) : profile?.stripe_account_id ? (
                      <Tag size="small" color="gold">
                        Not finished
                      </Tag>
                    ) : (
                      <Tag size="small" color="neutral">
                        Not set up
                      </Tag>
                    )}
                  </div>
                  {!profile?.payouts_ready && (
                    <>
                      <p className="text-label text-medium-grey">
                        {profile?.stripe_account_id
                          ? 'Stripe still needs a few details before you can be paid.'
                          : 'Until then, people can only book your free exchange options.'}
                      </p>
                      <Button variant="neutral" size="small" className="self-start" onClick={setUpPayouts} disabled={opening} aria-busy={opening || undefined}>
                        {opening ? 'Opening Stripe…' : profile?.stripe_account_id ? 'Finish setting up payouts' : 'Set up payouts'}
                      </Button>
                    </>
                  )}
                </div>
              </section>
            )}

            {error && <FormError>{error}</FormError>}
          </>
        )}
      </div>
    </main>
  )
}
