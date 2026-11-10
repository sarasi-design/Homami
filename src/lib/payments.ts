import { supabase } from './supabase'

/**
 * Payment details (database script 11 + the "payments" Edge Function). Cards and bank details live with
 * Stripe; Homami only keeps "Visa •••• 4242" and whether you can be paid. Only the function writes them.
 */
export interface PaymentProfile {
  card_brand: string | null
  card_last4: string | null
  card_exp: string | null
  stripe_account_id: string | null
  payouts_ready: boolean
}

const offline = 'We couldn’t reach Homami. Check your connection and try again.'
const needsUpdate = 'Homami’s database needs an update for bookings and payments (setup script 11). Please try again later.'
const missingTable = (error: { code?: string; message?: string }) =>
  error.code === '42P01' || error.code === 'PGRST205' || error.code === 'PGRST202' || /relation|schema cache|function/i.test(error.message ?? '')

export async function getPaymentProfile(userId: string): Promise<PaymentProfile | null> {
  const { data, error } = await supabase
    .from('payment_profiles')
    .select('card_brand, card_last4, card_exp, stripe_account_id, payouts_ready')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new Error(missingTable(error) ? needsUpdate : offline)
  return data as PaymentProfile | null
}

/** Calls the payments function and turns its answer (or a missing function) into words for people */
export async function callPayments<T = Record<string, unknown>>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke('payments', { body: { action, ...body } })
  if (error) {
    // The function sends { error: "…" } with a message meant for people
    const context = (error as { context?: Response }).context
    let message: string | undefined
    try {
      message = context ? (await context.json())?.error : undefined
    } catch {
      /* not JSON */
    }
    if (!message && /not found|404|Failed to send/i.test(error.message)) message = 'Payments aren’t set up yet.'
    throw new Error(message ?? 'Something went wrong with payments. Please try again.')
  }
  return data as T
}

export async function canBePaid(sitterId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('can_be_paid', { sitter: sitterId })
  if (error) return false
  return !!data
}

/** "Visa •••• 4242" */
export function cardLabel(p: Pick<PaymentProfile, 'card_brand' | 'card_last4'>) {
  if (!p.card_last4) return null
  const brand = p.card_brand ? p.card_brand.charAt(0).toUpperCase() + p.card_brand.slice(1) : 'Card'
  return `${brand === 'Amex' ? 'American Express' : brand} •••• ${p.card_last4}`
}
