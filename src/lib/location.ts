import { supabase } from './supabase'
import { z } from 'zod'
import { many } from './check'
import { databaseError, isMissingInDatabase, needsUpdate } from './errors'

/**
 * Your rough location, and pet sitters near you (database script 21; Sara, Nov 15, 2026).
 *   Tapping the pin asks the phone where you are. Homami keeps it rounded to about 1 km (two decimals)
 *   and never shows it to anyone. It fills in your city and works out how far pet sitters are.
 *   Pet sitters who added theirs show on the members' map at that rough spot, never their address.
 *   "Near you": within 10 km, or further if the sitter travels further than that.
 */

export const locationNeedsUpdate = needsUpdate('the map', 'script 21')
/** The error saveMyLocation throws before database script 21 */
export const isMissingLocation = (e: unknown) => e instanceof Error && e.message === locationNeedsUpdate

export interface Coords {
  lat: number
  lng: number
}

export interface SitterSpot extends Coords {
  sitter_id: string
  /** Whole km from you, at least 1; null when you haven't added your location */
  distance_km: number | null
  near: boolean
}

/** About 1 km: the only precision Homami ever keeps or sends anywhere */
export const roughly = (n: number) => Math.round(n * 100) / 100

/** Asks the phone where you are, already rounded. Throws an Error with a message for people. */
export function findMe(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('This browser can’t share your location. Type your city instead.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: roughly(p.coords.latitude), lng: roughly(p.coords.longitude) }),
      (e) =>
        reject(
          new Error(
            e.code === e.PERMISSION_DENIED
              ? 'Location is turned off for Homami. Allow it in your browser settings, or type your city.'
              : 'We couldn’t find where you are. Try again, or type your city.',
          ),
        ),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10 * 60 * 1000 },
    )
  })
}

/** The town for a rough location, from OpenStreetMap. Only the rounded location is sent. Null if it can't tell. */
export async function townFor({ lat, lng }: Coords): Promise<string | null> {
  try {
    const lang = typeof navigator !== 'undefined' ? navigator.language : 'en'
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&lat=${roughly(lat)}&lon=${roughly(lng)}&accept-language=${encodeURIComponent(lang)}`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    const a = ((await res.json()) as { address?: Record<string, string> }).address ?? {}
    return a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? null
  } catch {
    return null
  }
}

/**
 * Where a typed town or area is, from OpenStreetMap, rounded to ~1 km; null if it can't find it.
 * Places near `near` (your current rough location) come first, so "Centro" finds the one in your city.
 * Only the typed words (and that rough area) are sent.
 */
export async function placeCoords(text: string, near?: Coords | null): Promise<Coords | null> {
  const q = text.trim()
  if (!q) return null
  try {
    const lang = typeof navigator !== 'undefined' ? navigator.language : 'en'
    const box = near ? `&viewbox=${roughly(near.lng - 1)},${roughly(near.lat + 1)},${roughly(near.lng + 1)},${roughly(near.lat - 1)}` : ''
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}${box}&accept-language=${encodeURIComponent(lang)}`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    const [hit] = (await res.json()) as { lat: string; lon: string }[]
    if (!hit) return null
    const lat = Number(hit.lat)
    const lng = Number(hit.lon)
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat: roughly(lat), lng: roughly(lng) } : null
  } catch {
    return null
  }
}

/** Saves your rough location (the database rounds it again, to be sure) */
export async function saveMyLocation({ lat, lng }: Coords): Promise<void> {
  const { error } = await supabase.rpc('set_my_location', { p_lat: roughly(lat), p_lng: roughly(lng) })
  if (error) throw databaseError(error, locationNeedsUpdate)
}

/** Removes your saved rough location (you can add it again with the pin) */
export async function removeMyLocation(userId: string): Promise<void> {
  const { error } = await supabase.from('member_locations').delete().eq('user_id', userId)
  if (error) throw databaseError(error, locationNeedsUpdate)
}

/** Your saved rough location, or null. Before script 21, null. */
export async function getMyLocation(userId: string): Promise<Coords | null> {
  const { data, error } = await supabase.from('member_locations').select('lat, lng').eq('user_id', userId).maybeSingle()
  if (error) {
    if (isMissingInDatabase(error)) return null
    throw databaseError(error)
  }
  return data ? { lat: Number(data.lat), lng: Number(data.lng) } : null
}

const spotSchema: z.ZodType<SitterSpot> = z.object({
  sitter_id: z.string(),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  distance_km: z.number().nullable(),
  near: z.boolean(),
})

/** Pet sitters on the map, nearest first. Null before script 21. */
export async function listSitterSpots(): Promise<SitterSpot[] | null> {
  const { data, error } = await supabase.rpc('sitters_near_me')
  if (error) {
    if (isMissingInDatabase(error)) return null
    throw databaseError(error)
  }
  return many(spotSchema, data, 'pet sitters near you')
}

// ---- Words for people ----------------------------------------------------------------------

export function nearCountLabel(n: number) {
  if (n === 0) return 'No pet sitters near you yet'
  return n === 1 ? '1 pet sitter near you' : `${n} pet sitters near you`
}
