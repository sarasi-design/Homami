// Homami "payments" Edge Function (Supabase → Edge Functions → payments). Stripe, test mode for now.
// The only place that holds the Stripe secret key, and the only writer of payment_profiles and of
// paid bookings (database script 11). The app calls it with the person's login; every action checks
// who they are first.
//
// Secrets to set in Supabase → Edge Functions → Secrets:
//   STRIPE_SECRET_KEY    sk_test_… from Stripe → Developers → API keys (test mode)
//   APP_URLS             where the app runs, comma-separated, e.g.
//                        http://localhost:5173,https://homami.vercel.app
//                        (Stripe sends sitters back here after payout setup; nothing else is allowed)
//   HOMAMI_FEE_PERCENT   optional, Homami's share of each payment, e.g. 10. Default 0.
// SUPABASE_URL and the server key (SUPABASE_SECRET_KEYS or SUPABASE_SERVICE_ROLE_KEY) are provided by Supabase.
// Deploy from the dashboard (Edge Functions → Deploy a new function → Via Editor), named "payments".
//
// Actions (POST { action, ... }):
//   card-setup        → { clientSecret }      start adding a card (Stripe's card form uses it)
//   card-saved        { setupIntentId }       remember the card that was just added ("Visa •••• 4242")
//   card-remove                               forget your card
//   payouts-start     { returnPath }  → { url }   Stripe's page where sitters add bank details (Accounts v2)
//   payouts-refresh                           check with Stripe whether payouts are ready
//   accept-booking    { bookingId }           sitter accepts a paid booking: the owner's card is charged

import Stripe from 'npm:stripe@17.7.0'
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'

// Made on first use: without STRIPE_SECRET_KEY, Stripe refuses to start, and the function should answer
// "Payments aren't set up yet" instead of crashing.
let stripeClient: Stripe | null = null
const stripeApi = () => (stripeClient ??= new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2025-02-24.acacia' }))

// Projects on Supabase's newer API keys get SUPABASE_SECRET_KEYS ({"default": "sb_secret_…"});
// older ones get SUPABASE_SERVICE_ROLE_KEY. Either one lets this function write payment details.
function serverKey() {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (legacy) return legacy
  try {
    const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}') as Record<string, string>
    return keys.default ?? Object.values(keys)[0] ?? ''
  } catch {
    return ''
  }
}
const admin = createClient(Deno.env.get('SUPABASE_URL')!, serverKey(), { auth: { persistSession: false } })
const appUrls = (Deno.env.get('APP_URLS') ?? 'http://localhost:5173')
  .split(',')
  .map((u) => u.trim().replace(/\/$/, ''))
  .filter(Boolean)
const feePercent = Math.min(Math.max(Number(Deno.env.get('HOMAMI_FEE_PERCENT') ?? '0') || 0, 0), 30)

const cors = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && appUrls.includes(origin) ? origin : appUrls[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
})

class Friendly extends Error {}

// Stripe's v2 API (connected accounts for sitters) isn't in this version of the Stripe library: call it directly
const STRIPE_V2_VERSION = '2026-10-28.endive'
async function stripeV2<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const res = await fetch(`https://api.stripe.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
      'Stripe-Version': STRIPE_V2_VERSION,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Stripe ${method} ${path.split('?')[0]} failed: ${JSON.stringify(json?.error ?? json).slice(0, 800)}`)
  return json as T
}

async function profileOf(userId: string) {
  const { data } = await admin.from('payment_profiles').select('*').eq('user_id', userId).maybeSingle()
  return data as null | {
    stripe_customer_id: string | null
    stripe_account_id: string | null
    card_last4: string | null
    payouts_ready: boolean
  }
}

async function save(userId: string, values: Record<string, unknown>) {
  const { error } = await admin
    .from('payment_profiles')
    .upsert({ user_id: userId, ...values, updated_at: new Date().toISOString() })
  if (error) throw new Error(`Saving payment details failed: ${error.message}`)
}

async function customerFor(userId: string) {
  const p = await profileOf(userId)
  if (p?.stripe_customer_id) return p.stripe_customer_id
  // No email or name: Stripe only needs to know which Homami person this is
  const customer = await stripeApi().customers.create({ metadata: { homami_user: userId } })
  await save(userId, { stripe_customer_id: customer.id })
  return customer.id
}

async function handle(userId: string, email: string, body: Record<string, unknown>, origin: string | null) {
  switch (body.action) {
    case 'card-setup': {
      const customer = await customerFor(userId)
      const intent = await stripeApi().setupIntents.create({ customer, usage: 'off_session', payment_method_types: ['card'] })
      return { clientSecret: intent.client_secret }
    }

    case 'card-saved': {
      const intent = await stripeApi().setupIntents.retrieve(String(body.setupIntentId ?? ''), { expand: ['payment_method'] })
      const customer = await customerFor(userId)
      if (intent.customer !== customer || intent.status !== 'succeeded') throw new Friendly('That card wasn’t saved. Please try again.')
      const pm = intent.payment_method as Stripe.PaymentMethod
      await stripeApi().customers.update(customer, { invoice_settings: { default_payment_method: pm.id } })
      const card = pm.card!
      await save(userId, {
        card_brand: card.brand,
        card_last4: card.last4,
        card_exp: `${String(card.exp_month).padStart(2, '0')}/${String(card.exp_year).slice(-2)}`,
      })
      return { ok: true }
    }

    case 'card-remove': {
      const p = await profileOf(userId)
      if (p?.stripe_customer_id) {
        const methods = await stripeApi().paymentMethods.list({ customer: p.stripe_customer_id, type: 'card' })
        for (const m of methods.data) await stripeApi().paymentMethods.detach(m.id)
      }
      await save(userId, { card_brand: null, card_last4: null, card_exp: null })
      return { ok: true }
    }

    case 'payouts-start': {
      const base = origin && appUrls.includes(origin) ? origin : appUrls[0]
      const path = String(body.returnPath ?? '/#/payments')
      if (!path.startsWith('/')) throw new Friendly('Something went wrong. Please try again.')
      let accountId = (await profileOf(userId))?.stripe_account_id
      if (!accountId) {
        // Accounts v2 (Stripe requires it for new Connect platforms). A sitter is a "recipient": they receive
        // transfers from Homami, they don't charge cards themselves. Stripe needs a contact email for that,
        // so the sitter's login email goes to Stripe (and nowhere else). With the Express dashboard, Stripe
        // requires Homami (the "application") to collect fees and cover losses — a decision to revisit
        // before real money.
        const account = await stripeV2<{ id: string }>('POST', '/v2/core/accounts', {
          contact_email: email,
          dashboard: 'express',
          // Sitters are people, not companies: Stripe then skips questions about owners and company details
          identity: { country: 'es', entity_type: 'individual' },
          configuration: { recipient: { capabilities: { stripe_balance: { stripe_transfers: { requested: true } } } } },
          defaults: { currency: 'eur', responsibilities: { fees_collector: 'application', losses_collector: 'application' } },
          metadata: { homami_user: userId },
        })
        accountId = account.id
        await save(userId, { stripe_account_id: accountId })
      }
      const link = await stripeV2<{ url: string }>('POST', '/v2/core/account_links', {
        account: accountId,
        use_case: {
          type: 'account_onboarding',
          // Stripe works out what to ask from the account's own configuration (recipient)
          account_onboarding: {
            return_url: `${base}${path}${path.includes('?') ? '&' : '?'}payouts=back`,
            refresh_url: `${base}${path}${path.includes('?') ? '&' : '?'}payouts=again`,
          },
        },
      })
      return { url: link.url }
    }

    case 'payouts-refresh': {
      const p = await profileOf(userId)
      if (!p?.stripe_account_id) return { payoutsReady: false }
      const account = await stripeV2<{
        configuration?: { recipient?: { capabilities?: { stripe_balance?: { stripe_transfers?: { status?: string } } } } }
      }>('GET', `/v2/core/accounts/${encodeURIComponent(p.stripe_account_id)}?include[0]=configuration.recipient`)
      // Ready when Stripe lets Homami send them money
      const ready = account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status === 'active'
      await save(userId, { payouts_ready: ready })
      return { payoutsReady: ready }
    }

    case 'accept-booking': {
      const { data: booking } = await admin.from('bookings').select('*').eq('id', String(body.bookingId ?? '')).maybeSingle()
      if (!booking || booking.sitter_id !== userId) throw new Friendly('This booking isn’t yours to answer.')
      if (booking.status !== 'requested') throw new Friendly('This booking has already been answered.')
      if (booking.total_cents === 0) throw new Friendly('Free bookings are accepted without a payment.')

      const owner = await profileOf(booking.owner_id)
      const sitter = await profileOf(userId)
      if (!sitter?.stripe_account_id || !sitter.payouts_ready) throw new Friendly('Set up payouts in Payment details before accepting paid bookings.')
      if (!owner?.stripe_customer_id || !owner.card_last4) {
        await admin.from('bookings').update({ payment_status: 'failed', updated_at: new Date().toISOString() }).eq('id', booking.id)
        throw new Friendly('Their card isn’t on file any more. Send them a message so they can add one.')
      }
      const customer = await stripeApi().customers.retrieve(owner.stripe_customer_id) as Stripe.Customer
      const method = customer.invoice_settings?.default_payment_method
      try {
        const payment = await stripeApi().paymentIntents.create(
          {
            amount: booking.total_cents,
            currency: 'eur',
            customer: owner.stripe_customer_id,
            payment_method: typeof method === 'string' ? method : method?.id,
            off_session: true,
            confirm: true,
            description: `Homami pet sitting, ${booking.start_date} to ${booking.end_date}`,
            transfer_data: { destination: sitter.stripe_account_id },
            application_fee_amount: Math.round((booking.total_cents * feePercent) / 100),
            metadata: { homami_booking: booking.id },
          },
          // Accepting twice can never charge twice
          { idempotencyKey: `accept-${booking.id}` },
        )
        const { data: updated } = await admin
          .from('bookings')
          .update({ status: 'accepted', payment_status: 'paid', payment_intent_id: payment.id, updated_at: new Date().toISOString() })
          .eq('id', booking.id)
          .select('*')
          .single()
        return { booking: updated }
      } catch (err) {
        await admin.from('bookings').update({ payment_status: 'failed', updated_at: new Date().toISOString() }).eq('id', booking.id)
        console.error('Charging the owner failed', err)
        throw new Friendly('Their card was declined, so the booking wasn’t accepted. Send them a message so they can update it.')
      }
    }

    default:
      throw new Friendly('Something went wrong. Please try again.')
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin')
  const headers = { ...cors(origin), 'Content-Type': 'application/json' }
  if (req.method === 'OPTIONS') return new Response('ok', { headers })
  try {
    if (!Deno.env.get('STRIPE_SECRET_KEY')) throw new Friendly('Payments aren’t set up yet.')
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer /, '')
    const { data, error } = await admin.auth.getUser(token)
    if (error || !data.user) return new Response(JSON.stringify({ error: 'Please log in again.' }), { status: 401, headers })
    const body = await req.json().catch(() => ({}))
    const result = await handle(data.user.id, data.user.email ?? '', body, origin)
    return new Response(JSON.stringify(result), { headers })
  } catch (err) {
    console.error(err)
    const message = err instanceof Friendly ? err.message : 'Something went wrong with payments. Please try again.'
    return new Response(JSON.stringify({ error: message }), { status: 400, headers })
  }
})
