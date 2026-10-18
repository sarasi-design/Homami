import { supabase } from './supabase'
import { shrinkImage } from './images'
import type { ProfileValues } from '../screens/SetUpProfile'

export interface Profile {
  id: string
  first_name: string | null
  city: string | null
  avatar_url: string | null
  bio: string | null
}

const offline = 'We couldn’t reach Homami. Check your connection and try again.'

export async function getMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('id, first_name, city, avatar_url, bio').eq('id', userId).maybeSingle()
  if (error) throw new Error(offline)
  return data
}

/** Shrinks and uploads the photo (if there is one), then saves name, city and photo link. */
export async function saveMyProfile(userId: string, { firstName, city, photo, bio }: ProfileValues): Promise<Profile> {
  let avatarUrl: string | undefined
  if (photo) {
    let blob: Blob
    try {
      blob = await shrinkImage(photo)
    } catch {
      throw new Error('That photo couldn’t be opened. Try a different one, or skip it for now.')
    }
    const path = `${userId}/avatar-${Date.now()}.jpg` // a new name each time, so the new photo shows straight away
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg' })
    if (uploadError) throw new Error('Your photo didn’t upload. Try again, or skip it for now.')
    avatarUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
  }
  const { data, error } = await supabase
    .from('profiles')
    .update({
      first_name: firstName,
      city: city || null,
      ...(bio !== undefined ? { bio: bio || null } : {}),
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    })
    .eq('id', userId)
    .select('id, first_name, city, avatar_url, bio')
    .single()
  if (error) throw new Error(offline)
  return data
}
