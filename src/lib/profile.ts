import { supabase } from './supabase'
import { databaseError } from './errors'
import { publicLink, removePhoto, uploadPhoto } from './photos'
import type { ProfileValues } from '../screens/SetUpProfile'

export interface Profile {
  id: string
  first_name: string | null
  city: string | null
  avatar_url: string | null
  bio: string | null
  /** "How will you use Homami?": needs care, offers care, or both. Empty for people who joined before it was asked. */
  wants: 'care' | 'offer' | 'both' | null
}

/** Profile photos are public: many people may see your profile (see photos.ts) */
const photoMessages = {
  unreadable: 'That photo couldn’t be opened. Try a different one, or skip it for now.',
  failed: 'Your photo didn’t upload. Try again, or skip it for now.',
}

export async function getMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('id, first_name, city, avatar_url, bio, wants').eq('id', userId).maybeSingle()
  if (error) throw databaseError(error)
  return data
}

/** Shrinks and uploads the photo (if there is one), then saves name, city and photo link. A replaced photo is removed. */
export async function saveMyProfile(userId: string, { firstName, city, photo, bio }: ProfileValues): Promise<Profile> {
  const oldPhoto = photo ? (await getMyProfile(userId))?.avatar_url : null
  // A new name each time, so the new photo shows straight away
  const avatarUrl = photo ? publicLink(await uploadPhoto('avatars', userId, photo, 640, photoMessages)) : undefined
  const { data, error } = await supabase
    .from('profiles')
    .update({
      first_name: firstName,
      city: city || null,
      ...(bio !== undefined ? { bio: bio || null } : {}),
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    })
    .eq('id', userId)
    .select('id, first_name, city, avatar_url, bio, wants')
    .single()
  if (error) throw databaseError(error)
  if (avatarUrl) await removePhoto('avatars', oldPhoto)
  return data
}

export async function saveWants(userId: string, wants: 'care' | 'offer' | 'both'): Promise<void> {
  const { error } = await supabase.from('profiles').update({ wants }).eq('id', userId)
  if (error) throw databaseError(error)
}
