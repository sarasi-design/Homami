import { supabase } from './supabase'
import { z } from 'zod'
import { many, maybeOne, money, one, text } from './check'
import { databaseError, needsUpdate } from './errors'
import type { DatabaseError } from './errors'
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
  /** Last day they're available, 'YYYY-MM-DD'; null = no end (database script 14) */
  available_until?: string | null
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

/** A missing table or column means a database script hasn't been run yet (06 pet sitters, 07 travel switch). */
const sittersNeedUpdate = needsUpdate('pet sitting', 'scripts 06 and 07')
const baseColumns = 'user_id, offers, available_from, area, radius_km, travels, daily_rate, overnight_rate, walk_rate, stay_for_care, sitting_exchange'
const columns = `${baseColumns}, available_until`
/** The "available until" column comes with database script 14; until it's run, everything else keeps working */
const untilMissing = (error: DatabaseError) =>
  (error.code === '42703' || error.code === 'PGRST204') && /available_until/.test(error.message ?? '')
const needsUntil = 'Homami’s database needs an update to save an end date (setup script 14). Leave the last day empty for now, or try again later.'

/** What a sitter profile looks like from the database. Money comes back as text ("12.50"): numbers again. */
const OFFER_IDS = OFFERS.map((o) => o.id) as [OfferId, ...OfferId[]]
const sitterFields = {
  user_id: z.string(),
  offers: z.array(z.enum(OFFER_IDS)),
  available_from: text,
  /** Before database script 14 there's no end date */
  available_until: text.optional().transform((v) => v ?? null),
  area: text,
  radius_km: z.number().nullable(),
  travels: z.boolean(),
  daily_rate: money,
  overnight_rate: money,
  walk_rate: money,
  stay_for_care: z.boolean(),
  sitting_exchange: z.boolean(),
}
const sitterSchema: z.ZodType<SitterProfile> = z.object(sitterFields)
const sitterListingSchema: z.ZodType<SitterListing> = z.object({
  ...sitterFields,
  profile: z.object({ first_name: text, city: text, avatar_url: text }).nullable(),
})

export async function getSitterProfile(userId: string): Promise<SitterProfile | null> {
  let { data, error } = await supabase.from('sitter_profiles').select(columns).eq('user_id', userId).maybeSingle()
  if (error && untilMissing(error)) ({ data, error } = await supabase.from('sitter_profiles').select(baseColumns).eq('user_id', userId).maybeSingle())
  if (error) throw databaseError(error)
  return maybeOne(sitterSchema, data, 'a pet sitter profile')
}

export async function saveSitterProfile(userId: string, values: SitterValues): Promise<SitterProfile> {
  const save = (row: Partial<SitterValues>, cols: string) =>
    supabase
      .from('sitter_profiles')
      .upsert({ user_id: userId, ...row, updated_at: new Date().toISOString() })
      .select(cols)
      .single()
  let { data, error } = await save(values, columns)
  if (error && untilMissing(error)) {
    if (values.available_until) throw new Error(needsUntil)
    const { available_until: _skip, ...rest } = values
    void _skip
    ;({ data, error } = await save(rest, baseColumns))
  }
  if (error) {
    console.error('Saving sitter profile failed', error)
    throw databaseError(error, sittersNeedUpdate)
  }
  return one(sitterSchema, data, 'your pet sitter profile')
}

export async function removeSitterProfile(userId: string): Promise<void> {
  const { error } = await supabase.from('sitter_profiles').delete().eq('user_id', userId)
  if (error) throw databaseError(error)
}

/** Everyone offering pet sitting, except you. */
export async function listSitters(myId: string): Promise<SitterListing[]> {
  const list = (cols: string) =>
    supabase
      .from('sitter_profiles')
      .select(`${cols}, profile:profiles(first_name, city, avatar_url)`)
      .neq('user_id', myId)
      .order('updated_at', { ascending: false })
      .limit(100)
  let { data, error } = await list(columns)
  if (error && untilMissing(error)) ({ data, error } = await list(baseColumns))
  if (error) throw databaseError(error)
  return many(sitterListingSchema, data, 'pet sitters').filter((s) => s.profile?.first_name)
}

// ---- Words for people ----------------------------------------------------------------------

const today = () => new Date().toISOString().slice(0, 10)

export function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

const short = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

/** "Available now", "Available from 3 Nov", "Available until 5 Dec", "Available 20 Nov – 5 Dec" or "Not available right now" */
export function availabilityLabel(availableFrom: string | null, availableUntil: string | null = null) {
  const later = !!availableFrom && availableFrom > today()
  if (availableUntil && availableUntil < today()) return 'Not available right now'
  if (later && availableUntil) return `Available ${short(availableFrom!)} – ${short(availableUntil)}`
  if (later) return `Available from ${short(availableFrom!)}`
  if (availableUntil) return `Available until ${short(availableUntil)}`
  return 'Available now'
}

export const euros = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(2)} €`

/** The cheapest priced service, e.g. "From 9 €" — or the free options when nothing is priced. */
export function priceSummary(s: Pick<SitterProfile, 'daily_rate' | 'overnight_rate' | 'walk_rate' | 'stay_for_care' | 'sitting_exchange'>) {
  const prices = [s.daily_rate, s.overnight_rate, s.walk_rate].filter((p): p is number => p !== null)
  if (prices.length) return `From ${euros(Math.min(...prices))}`
  if (s.stay_for_care || s.sitting_exchange) return 'Exchange, no fees'
  return null
}
