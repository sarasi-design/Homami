import { supabase } from './supabase'

/** The trusted circle: personal invite links, who's in your circle, joining someone's circle. */

const offline = 'We couldn’t reach Homami. Check your connection and try again.'

export interface CircleMember {
  id: string
  first_name: string | null
  city: string | null
  avatar_url: string | null
  shared_count: number
}

export interface PersonProfile {
  id: string
  first_name: string | null
  city: string | null
  avatar_url: string | null
  bio: string | null
}

/** Your personal code, made when you joined */
export async function getMyInviteCode(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('invite_codes')
    .select('code')
    .eq('created_by', userId)
    .eq('note', 'personal')
    .maybeSingle()
  if (error) throw new Error(offline)
  return data?.code ?? null
}

/** A code made on Your profile → Invite friends (database script 12): one person, 30 days. */
export interface InviteCode {
  code: string
  uses: number
  expires_at: string
  created_at: string
}

/** A missing function or rule means database script 12 hasn't been run yet. */
const codesNeedUpdate = 'Homami’s database needs an update for invite codes (setup script 12). Please try again later.'
const codesError = (error: { code?: string; message?: string }) =>
  ['42883', 'PGRST202'].includes(error.code ?? '') || /Could not find the function|schema cache/i.test(error.message ?? '')
    ? new Error(codesNeedUpdate)
    : new Error(error.message?.startsWith('You already have') ? error.message : offline)

/** The one-time codes you made, newest first (also the used and expired ones, so you can see who joined) */
export async function listMyInviteCodes(userId: string): Promise<InviteCode[]> {
  const { data, error } = await supabase
    .from('invite_codes')
    .select('code, uses, expires_at, created_at')
    .eq('created_by', userId)
    .eq('note', 'one-time')
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw new Error(offline)
  return (data ?? []) as InviteCode[]
}

export async function createInviteCode(): Promise<InviteCode> {
  const { data, error } = await supabase.rpc('create_invite_code')
  if (error) throw codesError(error)
  return data as InviteCode
}

/** Delete a code nobody has used yet */
export async function removeInviteCode(code: string) {
  const { error } = await supabase.from('invite_codes').delete().eq('code', code)
  if (error) throw codesError(error)
}

/** Someone may paste a whole invite link into the code field: keep just the code */
export function codeFromInput(value: string) {
  const match = value.match(/[?&]invite=([^&#\s]+)/i)
  return (match ? decodeURIComponent(match[1]) : value).trim().toUpperCase()
}

/** Where friends open Homami. Invite links always point here, even when you copy yours from the app on your
 *  own computer (localhost), which nobody else can open. VITE_SITE_URL can change it. */
export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? 'https://homami-sepia.vercel.app').replace(/\/$/, '')

const onThisComputer = () => /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)

export function inviteLinkFor(code: string) {
  return `${onThisComputer() ? SITE_URL : window.location.origin}/?invite=${code}`
}

export async function getMyCircle(): Promise<CircleMember[]> {
  const { data, error } = await supabase.rpc('my_circle')
  if (error) throw new Error(offline)
  return (data ?? []) as CircleMember[]
}

/** Someone in your circle (or you) */
export async function getPerson(id: string): Promise<PersonProfile | null> {
  const { data, error } = await supabase.from('profiles').select('id, first_name, city, avatar_url, bio').eq('id', id).maybeSingle()
  if (error) throw new Error(offline)
  return data
}

/** Whose invite link is this? Null when the code doesn't work (or isn't a personal one). */
export async function getInviteOwner(code: string): Promise<{ id: string; first_name: string | null; avatar_url: string | null } | null> {
  const { data, error } = await supabase.rpc('invite_owner', { invite: code })
  if (error) throw new Error(offline)
  const row = Array.isArray(data) ? data[0] : data
  return row ?? null
}

export async function joinCircle(code: string): Promise<void> {
  const { error } = await supabase.rpc('join_circle', { invite: code })
  if (!error) return
  if (/OWN_INVITE/.test(error.message)) throw new Error('That’s your own invite link. Share it with a friend instead!')
  if (/INVITE_INVALID/.test(error.message)) throw new Error('This invite link doesn’t work any more. Ask your friend to send it again.')
  throw new Error(offline)
}

/** Friends of the people in your circle (database script 08), most shared first. */
export async function getExtendedCircle(): Promise<CircleMember[]> {
  const { data, error } = await supabase.rpc('my_extended_circle')
  if (error) throw new Error(offline)
  return data as CircleMember[]
}
