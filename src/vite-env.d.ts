/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  /** Stripe publishable key (pk_test_… for now). Without it, Payment details says payments aren't set up yet. */
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string
  /** The public site friends open (invite links point here). Defaults to https://homami-sepia.vercel.app */
  readonly VITE_SITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
