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

export function inviteLinkFor(code: string) {
  return `${window.location.origin}/?invite=${code}`
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
