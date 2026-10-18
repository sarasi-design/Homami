import { supabase } from './supabase'
import type { TagColor } from '../components/basics/Tag'

/**
 * Pet sitters (database script 06). Every member can see sitters; only you can change yours.
 * Prices are in euros.
 */

export const OFFERS = [
  { id: 'accommodation_exchange', label: 'Accommodation exchange', color: 'sage' },
  { id: 'live_in', label: 'Live-in sitting', color: 'gold' },
  { id: 'dog_walking', label: 'Dog walking', color: 'bubble' },
  { id: 'grooming', label: 'Pet grooming', color: 'glicine' },
  { id: 'boarding', label: 'Pet boarding', color: 'peach' },
  { id: 'training', label: 'Pet training', color: 'salmon' },
] as const satisfies readonly { id: string; label: string; color: TagColor }[]

export type OfferId = (typeof OFFERS)[number]['id']

export const offerInfo = (id: string) => OFFERS.find((o) => o.id === id)

export interface SitterProfile {
  user_id: string
  offers: OfferId[]
  available_from: string | null // 'YYYY-MM-DD'
  area: string | null
  radius_km: number | null
  /** false: doesn't travel, pets come to them (database script 07) */
  travels: boolean
  daily_rate: number | null
  overnight_rate: number | null
  walk_rate: number | null
  stay_for_care: boolean
  sitting_exchange: boolean
}

export type SitterValues = Omit<SitterProfile, 'user_id'>

export interface SitterListing extends SitterProfile {
  profile: { first_name: string | null; city: string | null; avatar_url: string | null } | null
}

const offline = 'We couldn’t reach Homami. Check your connection and try again.'
/** A missing table or column means a database script hasn't been run yet (06 pet sitters, 07 travel switch). */
const needsUpdate = 'Homami’s database needs an update for pet sitting (setup scripts 06 and 07). Please try again later.'
const friendly = (error: { code?: string; message?: string }) =>
  error.code === '42P01' || error.code === '42703' || error.code === 'PGRST204' || error.code === 'PGRST205' || /column|relation|schema cache/i.test(error.message ?? '')
    ? needsUpdate
    : offline
const columns = 'user_id, offers, available_from, area, radius_km, travels, daily_rate, overnight_rate, walk_rate, stay_for_care, sitting_exchange'

/** Numbers come back from the database as text for money columns; make them numbers again. */
function clean<T extends SitterProfile>(row: T): T {
  const num = (v: unknown) => (v === null || v === undefined ? null : Number(v))
  return { ...row, daily_rate: num(row.daily_rate), overnight_rate: num(row.overnight_rate), walk_rate: num(row.walk_rate) }
}

export async function getSitterProfile(userId: string): Promise<SitterProfile | null> {
  const { data, error } = await supabase.from('sitter_profiles').select(columns).eq('user_id', userId).maybeSingle()
  if (error) throw new Error(offline)
  return data ? clean(data as SitterProfile) : null
}

export async function saveSitterProfile(userId: string, values: SitterValues): Promise<SitterProfile> {
  const { data, error } = await supabase
    .from('sitter_profiles')
    .upsert({ user_id: userId, ...values, updated_at: new Date().toISOString() })
    .select(columns)
    .single()
  if (error) {
    console.error('Saving sitter profile failed', error)
    throw new Error(friendly(error))
  }
  return clean(data as SitterProfile)
}

export async function removeSitterProfile(userId: string): Promise<void> {
  const { error } = await supabase.from('sitter_profiles').delete().eq('user_id', userId)
  if (error) throw new Error(offline)
}

/** Everyone offering pet sitting, except you. */
export async function listSitters(myId: string): Promise<SitterListing[]> {
  const { data, error } = await supabase
    .from('sitter_profiles')
    .select(`${columns}, profile:profiles(first_name, city, avatar_url)`)
    .neq('user_id', myId)
    .order('updated_at', { ascending: false })
    .limit(100)
  if (error) throw new Error(offline)
  return (data as unknown as SitterListing[]).filter((s) => s.profile?.first_name).map(clean)
}

// ---- Words for people ----------------------------------------------------------------------

const today = () => new Date().toISOString().slice(0, 10)

export function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** "Available now" or "Available from 3 Nov" */
export function availabilityLabel(availableFrom: string | null) {
  if (!availableFrom || availableFrom <= today()) return 'Available now'
  return `Available from ${new Date(`${availableFrom}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
}

export const euros = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(2)} €`

/** The cheapest priced service, e.g. "From 9 €" — or the free options when nothing is priced. */
export function priceSummary(s: Pick<SitterProfile, 'daily_rate' | 'overnight_rate' | 'walk_rate' | 'stay_for_care' | 'sitting_exchange'>) {
  const prices = [s.daily_rate, s.overnight_rate, s.walk_rate].filter((p): p is number => p !== null)
  if (prices.length) return `From ${euros(Math.min(...prices))}`
  if (s.stay_for_care || s.sitting_exchange) return 'Exchange, no fees'
  return null
}
