import { useEffect, useRef, useState } from 'react'
import { Lock } from 'lucide-react'
import { Button } from '../basics/Button'
import { Icon } from '../basics/Icon'
import { Note } from '../basics/Note'
import { callPayments } from '../../lib/payments'
import { loadStripe, testMode } from '../../lib/stripe'
import type { StripeElements, StripeJs } from '../../lib/stripe'

/**
 * CardForm — add a card for paying pet sitters. Stripe's own card fields (the Payment Element) sit inside
 * a Homami card, styled with Homami's tokens (read from the page, so they follow tokens.css).
 * The card number is typed into Stripe's frame and never reaches Homami; when saved, Homami keeps
 * only "Visa •••• 4242". In test mode a Note explains Stripe's test card.
 *   onSaved   the card is saved (Your payment details reloads)
 *   onCancel  "Cancel" next to Save
 */
export interface CardFormProps {
  onSaved: () => void
  onCancel?: () => void
}

const token = (name: string, fallback: string) =>
  (typeof document !== 'undefined' && getComputedStyle(document.documentElement).getPropertyValue(name).trim()) || fallback

export function CardForm({ onSaved, onCancel }: CardFormProps) {
  const holder = useRef<HTMLDivElement>(null)
  const [stripe, setStripe] = useState<StripeJs | null>(null)
  const [elements, setElements] = useState<StripeElements | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Ask Homami's payments function to start a card setup, then put Stripe's fields on the page
  useEffect(() => {
    let cancelled = false
    let element: { destroy: () => void } | null = null
    Promise.all([loadStripe(), callPayments<{ clientSecret: string }>('card-setup')])
      .then(([s, { clientSecret: secret }]) => {
        if (cancelled || !holder.current) return
        const els = s.elements({
          clientSecret: secret,
          fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600&display=swap' }],
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: token('--color-primary-sage', '#49653a'),
              colorText: token('--color-dark-grey', '#262625'),
              colorTextSecondary: token('--color-medium-grey', '#666664'),
              colorDanger: token('--color-error', '#c84c22'),
              colorBackground: token('--color-surface', '#ffffff'),
              fontFamily: '"Work Sans", system-ui, sans-serif',
              borderRadius: token('--radius-input', '4px'),
              spacingUnit: '4px',
            },
            rules: { '.Input': { borderColor: token('--color-soft-grey', '#cccbc9'), boxShadow: 'none' } },
          },
        })
        const payment = els.create('payment', { layout: 'tabs', wallets: { applePay: 'never', googlePay: 'never' } })
        payment.on('ready', () => !cancelled && setReady(true))
        payment.mount(holder.current)
        element = payment
        setStripe(s)
        setElements(els)
        setClientSecret(secret)
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.'))
    return () => {
      cancelled = true
      element?.destroy()
    }
  }, [])

  async function save() {
    if (!stripe || !elements || !clientSecret) return
    setSaving(true)
    setError(null)
    try {
      const submitted = await elements.submit()
      if (submitted.error) throw new Error(submitted.error.message ?? 'Check the card details.')
      const result = await stripe.confirmSetup({ elements, clientSecret, redirect: 'if_required' })
      if (result.error) throw new Error(result.error.message ?? 'That card couldn’t be saved.')
      if (!result.setupIntent) throw new Error('That card couldn’t be saved.')
      await callPayments('card-saved', { setupIntentId: result.setupIntent.id })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-l rounded-card border border-soft-grey p-l">
      {testMode && (
        <Note title="Test mode: no real money moves">
          Use the card 4242 4242 4242 4242, any future date and any 3 numbers.
        </Note>
      )}
      <div ref={holder} className="min-h-[120px]" aria-busy={!ready || undefined} />
      {!ready && !error && <p className="text-label text-medium-grey">Opening Stripe’s card form…</p>}
      {error && (
        <p role="alert" className="text-label text-error">
          {error}
        </p>
      )}
      <p className="flex items-center gap-s text-caption text-medium-grey">
        <Icon icon={Lock} size="small" className="shrink-0" />
        Your card details go straight to Stripe. Homami only keeps the last 4 numbers.
      </p>
      <div className="flex flex-wrap items-center gap-m">
        <Button variant="neutral" size="small" onClick={save} disabled={!ready || saving} aria-busy={saving || undefined}>
          {saving ? 'Saving…' : 'Save card'}
        </Button>
        {onCancel && (
          <Button variant="ghost" size="small" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}
