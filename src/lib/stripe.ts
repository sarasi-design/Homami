/**
 * Stripe.js, loaded straight from Stripe (js.stripe.com, as Stripe requires) the first time a card form
 * opens — no npm package. Card numbers are typed into Stripe's own fields and never reach Homami.
 * Needs VITE_STRIPE_PUBLISHABLE_KEY in .env (the pk_test_… key; it's public by design).
 */

/* Just the parts of Stripe.js Homami uses */
export interface StripeElement {
  mount: (el: HTMLElement) => void
  destroy: () => void
  on: (event: 'ready' | 'change', handler: (e: { complete?: boolean }) => void) => void
}
export interface StripeElements {
  create: (type: 'payment', options?: Record<string, unknown>) => StripeElement
  submit: () => Promise<{ error?: { message?: string } }>
}
export interface StripeJs {
  elements: (options: Record<string, unknown>) => StripeElements
  confirmSetup: (options: {
    elements: StripeElements
    clientSecret: string
    redirect: 'if_required'
    confirmParams?: Record<string, unknown>
  }) => Promise<{ error?: { message?: string }; setupIntent?: { id: string; status: string } }>
}
declare global {
  interface Window {
    Stripe?: (key: string) => StripeJs
  }
}

const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

/** Payments only work once the Stripe key is in .env */
export const paymentsConfigured = !!key

/** True while the key is a test key: the app then explains how to use Stripe's test cards */
export const testMode = !!key && key.startsWith('pk_test_')

let loading: Promise<StripeJs> | null = null

export function loadStripe(): Promise<StripeJs> {
  if (!key) return Promise.reject(new Error('Payments aren’t set up yet.'))
  if (loading) return loading
  loading = new Promise<StripeJs>((resolve, reject) => {
    const done = () => (window.Stripe ? resolve(window.Stripe(key)) : reject(new Error('Stripe couldn’t load.')))
    if (window.Stripe) return done()
    const script = document.createElement('script')
    script.src = 'https://js.stripe.com/v3/'
    script.async = true
    script.onload = done
    script.onerror = () => {
      loading = null
      reject(new Error('We couldn’t reach Stripe. Check your connection and try again.'))
    }
    document.head.appendChild(script)
  })
  return loading
}
