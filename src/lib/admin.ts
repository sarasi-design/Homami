import { z } from 'zod'
import { supabase } from './supabase'
import { many, one, text } from './check'
import { databaseError, isMissingInDatabase, needsUpdate } from './errors'
import type { InterestPlace } from './interest'

/**
 * The Homami team page, #/admin (database script 19; Sara, Nov 14, 2026).
 * Only for people in public.admins, which can only be changed in Supabase. Read only: nothing can be changed here.
 */

const teamPageNeedsUpdate = needsUpdate('the team page', 'script 19')

/** Are you on the Homami team? No when script 19 hasn't been run, or anything goes wrong. */
export async function isAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin')
  return !error && data === true
}

const count = z.coerce.number()

export interface InterestByPlace {
  place: InterestPlace
  taps: number
  people: number
}

const overviewSchema = z.object({
  members: count,
  members_7_days: count,
  members_30_days: count,
  sitters: count,
  pets: count,
  posts: count,
  care_requests: count,
  bookings: count,
  bookings_accepted: count,
  bookings_paid: count,
  reviews: count,
  interest: z.array(z.object({ place: z.enum(['sitter_setup', 'book', 'care_request']), taps: count, people: count })),
  interest_people: count,
})
export type TeamOverview = z.infer<typeof overviewSchema>

const memberSchema = z.object({
  id: z.string(),
  first_name: text,
  email: text,
  city: text,
  wants: text,
  joined_at: z.string(),
  last_sign_in_at: text,
  invited_by_name: text,
  offers_care: z.boolean(),
  pet_count: count,
})
export type TeamMember = z.infer<typeof memberSchema>

const tapSchema = z.object({ user_id: z.string(), first_name: text, email: text, place: z.enum(['sitter_setup', 'book', 'care_request']), tapped_at: z.string() })
export type InterestTap = z.infer<typeof tapSchema>

async function call(fn: 'admin_overview' | 'admin_members' | 'admin_interest') {
  const { data, error } = await supabase.rpc(fn)
  if (error) {
    if (isMissingInDatabase(error)) throw new Error(teamPageNeedsUpdate)
    if (error.code === '42501') throw new Error('This page is only for the Homami team.')
    throw databaseError(error)
  }
  return data as unknown
}

export const getTeamOverview = async () => one(overviewSchema, await call('admin_overview'), 'team numbers')
export const listTeamMembers = async () => many(memberSchema, await call('admin_members'), 'members')
export const listInterestTaps = async () => many(tapSchema, await call('admin_interest'), 'interest')

export const PLACE_LABELS: Record<InterestPlace, string> = {
  sitter_setup: 'Set up pet sitter profile',
  book: 'Book a sitter',
  care_request: 'Create a request',
}
