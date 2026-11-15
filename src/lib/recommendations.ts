import { supabase } from './supabase'
import { z } from 'zod'
import { many, maybeOne, money, text } from './check'
import { OFFLINE, databaseError, isMissingInDatabase, needsUpdate } from './errors'
import { OFFERS } from './sitters'
import { siteOrigin } from './inviteLink'
import type { OfferId, SitterProfile } from './sitters'

/**
 * Recommending pet sitters, and each sitter's own link (database script 20; Sara, Nov 15, 2026).
 *   Anyone who has used a sitter (through Homami or not) can recommend them: which pets (optional) and a short note.
 *   One per person per sitter; never paid for; you can't recommend yourself.
 *   Recommendations are public with your first name and photo. Members also see the pets and how they know you.
 *   Every sitter has one link, …/?sitter=CODE: a public page anyone can open, which also works as an invite.
 */

const recsNeedUpdate = needsUpdate('recommendations', 'script 20')
export const NOTE_MAX = 300

/** 0 you · 1 your circle · 2 your extended circle · 3 someone you don't know */
export type RecCloseness = 0 | 1 | 2 | 3

export interface Recommendation {
  author_id: string
  first_name: string | null
  avatar_url: string | null
  closeness: RecCloseness
  pet_names: string[]
  note: string | null
  created_at: string
  updated_at: string
}

export interface MyRecommendation {
  pet_ids: string[]
  note: string | null
}

export interface RecommendationValues {
  petIds: string[]
  note: string
}

const recSchema: z.ZodType<Recommendation> = z.object({
  author_id: z.string(),
  first_name: text,
  avatar_url: text,
  closeness: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  pet_names: z.array(z.string()).nullable().transform((v) => v ?? []),
  note: text,
  created_at: z.string(),
  updated_at: z.string(),
})
const myRecSchema: z.ZodType<MyRecommendation> = z.object({ pet_ids: z.array(z.string()), note: text })

/** Everyone who recommended this sitter, people you know first. Before script 20, simply none. */
export async function listRecommendations(sitterId: string): Promise<Recommendation[]> {
  const { data, error } = await supabase.rpc('sitter_recommendations_for', { p_sitter: sitterId })
  if (error) {
    if (isMissingInDatabase(error)) return []
    throw new Error(OFFLINE)
  }
  return many(recSchema, data, 'recommendations')
}

/** Your recommendation of this sitter, if you wrote one */
export async function getMyRecommendation(me: string, sitterId: string): Promise<MyRecommendation | null> {
  const { data, error } = await supabase.from('sitter_recommendations').select('pet_ids, note').eq('author_id', me).eq('sitter_id', sitterId).maybeSingle()
  if (error) {
    if (isMissingInDatabase(error)) return null
    throw new Error(OFFLINE)
  }
  return maybeOne(myRecSchema, data, 'your recommendation')
}

export async function saveRecommendation(sitterId: string, v: RecommendationValues): Promise<void> {
  const { error } = await supabase.rpc('recommend_sitter', { p_sitter: sitterId, p_pet_ids: v.petIds, p_note: v.note })
  if (error) {
    console.error('Saving the recommendation failed', error)
    throw databaseError(error, recsNeedUpdate)
  }
}

export async function removeRecommendation(me: string, sitterId: string): Promise<void> {
  const { error } = await supabase.from('sitter_recommendations').delete().eq('author_id', me).eq('sitter_id', sitterId)
  if (error) throw databaseError(error, recsNeedUpdate)
}

/** Pet sitters who joined with your invite and you haven't recommended yet */
export async function listSittersToRecommend(): Promise<{ id: string; first_name: string | null; avatar_url: string | null }[]> {
  const { data, error } = await supabase.rpc('sitters_to_recommend')
  if (error) return []
  return many(z.object({ id: z.string(), first_name: text, avatar_url: text }), data, 'sitters to recommend')
}

// ---- A sitter's public page and link -----------------------------------------------------------

export interface PublicRecommendation {
  first_name: string | null
  avatar_url: string | null
  note: string | null
  created_at: string
}

export interface PublicSitterPage {
  id: string
  first_name: string | null
  avatar_url: string | null
  city: string | null
  bio: string | null
  sitter: Omit<SitterProfile, 'user_id'>
  recommendations: PublicRecommendation[]
  recommend_count: number
}

const OFFER_IDS = OFFERS.map((o) => o.id) as [OfferId, ...OfferId[]]
const publicSchema: z.ZodType<PublicSitterPage> = z.object({
  id: z.string(),
  first_name: text,
  avatar_url: text,
  city: text,
  bio: text,
  sitter: z.object({
    offers: z.array(z.enum(OFFER_IDS)).catch([]),
    available_from: text,
    available_until: text,
    area: text,
    radius_km: z.number().nullable(),
    travels: z.boolean(),
    daily_rate: money,
    overnight_rate: money,
    walk_rate: money,
    stay_for_care: z.boolean(),
    sitting_exchange: z.boolean(),
  }),
  recommendations: z.array(z.object({ first_name: text, avatar_url: text, note: text, created_at: z.string() })),
  recommend_count: z.coerce.number(),
})

/** A sitter's public page from their link. null when the link doesn't (or no longer) work. */
export async function getPublicSitterPage(code: string): Promise<PublicSitterPage | null> {
  const { data, error } = await supabase.rpc('public_sitter_page', { p_code: code })
  if (error) {
    if (isMissingInDatabase(error)) return null
    throw new Error(OFFLINE)
  }
  return maybeOne(publicSchema, data, 'pet sitter page')
}

/** Your own link's code, if you're a pet sitter (null before script 20) */
export async function getMyShareCode(me: string): Promise<string | null> {
  const { data, error } = await supabase.from('sitter_profiles').select('share_code').eq('user_id', me).maybeSingle()
  if (error || !data) return null
  return maybeOne(z.object({ share_code: text }), data, 'your link')?.share_code ?? null
}

export const sitterLinkFor = (code: string) => `${siteOrigin()}/?sitter=${code}`

/** What the person opening a sitter's link came to do */
export type LinkIntent = 'look' | 'contact' | 'recommend'
export interface PendingSitterLink {
  code: string
  intent: LinkIntent
}

const PENDING_KEY = 'homami:sitter-link'

/** …/?sitter=CODE: the code in the address, if there is one (the sign-up email adds &do=recommend or &do=contact) */
export function sitterCodeFromLink(): string | null {
  const code = new URLSearchParams(window.location.search).get('sitter')
  return code && /^[a-z0-9]{6,40}$/i.test(code) ? code.toLowerCase() : null
}

/** Remembers the sitter while someone signs up or logs in (also across the email confirmation, on the same phone) */
export function rememberSitterLink(link: PendingSitterLink) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(link))
  } catch {
    // private browsing: the address still carries the code
  }
}

export function pendingSitterLink(): PendingSitterLink | null {
  const fromAddress = sitterCodeFromLink()
  let saved: PendingSitterLink | null = null
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    saved = raw ? (JSON.parse(raw) as PendingSitterLink) : null
  } catch {
    saved = null
  }
  const asked = new URLSearchParams(window.location.search).get('do')
  const intent: LinkIntent = saved?.code === fromAddress ? saved.intent : asked === 'recommend' || asked === 'contact' ? asked : 'look'
  if (fromAddress) return { code: fromAddress, intent }
  return saved && typeof saved.code === 'string' ? saved : null
}

/** Done with the link: take it out of the address and forget it */
export function clearSitterLink() {
  try {
    localStorage.removeItem(PENDING_KEY)
  } catch {
    // nothing to forget
  }
  const url = new URL(window.location.href)
  if (!url.searchParams.has('sitter')) return
  url.searchParams.delete('sitter')
  url.searchParams.delete('do')
  window.history.replaceState(null, '', url.pathname + url.search + url.hash)
}

// ---- Words -----------------------------------------------------------------------------------

/** "In your circle" · "In your extended circle" · "" */
export const recRelation = (c: RecCloseness) => (c === 1 ? 'In your circle' : c === 2 ? 'In your extended circle' : '')

/** "Looked after Luna" · "Looked after Luna and Milo" · "Looked after Luna, Milo and Kiki" */
export function petsLine(names: string[]) {
  if (names.length === 0) return null
  if (names.length === 1) return `Looked after ${names[0]}`
  return `Looked after ${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

/** "Recommended by Anna, Francesca and 3 others" for the public page (nobody is "known" there) */
export function publicRecommendedLabel(names: (string | null)[], total: number) {
  if (total === 0) return null
  const shown = names.filter(Boolean).slice(0, 2) as string[]
  const others = total - shown.length
  if (shown.length === 0) return `Recommended by ${total} ${total === 1 ? 'person' : 'people'}`
  if (others === 0) return `Recommended by ${shown.join(' and ')}`
  return `Recommended by ${shown.join(', ')} and ${others} ${others === 1 ? 'other' : 'others'}`
}

/** The message a sitter sends with their link */
export const sitterShareText = (name: string) =>
  `Hi! I’m ${name}, and I’m on Homami, where people find pet sitters their friends already trust. If I’ve looked after your pets, I’d love a recommendation. And if you know someone who needs a sitter, send them my page:`

/** The message an owner sends their own sitter, with their invite link */
export const inviteYourSitterText = (ownerName: string) =>
  `Hi! It’s ${ownerName}. I’m on Homami, where people find pet sitters their friends already trust. Join with my link and set up your sitter profile, so I can recommend you to my friends:`
