import { createClient } from '@supabase/supabase-js'

/** The one connection to Homami's Supabase project. Values come from the .env file. */
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error('Supabase is not configured: add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env')
}

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})
