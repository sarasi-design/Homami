import { supabase } from './supabase'
import { shrinkImage } from './images'

/**
 * Photos people add: profile photos, pet photos and post photos. One place to shrink, upload, show and remove them.
 *
 * Every photo lives in a folder named after the person who added it, under a random name nobody can guess:
 * "<their id>/<random>.jpg". The database only stores where it lives.
 *   avatars       profile photos. Public, because many people may see your profile (circle, sitters, chats).
 *   post-photos   private: you and your circle (database script 16)
 *   pet-photos    private: you and your circle (database script 17)
 * Private photos are shown through links that stop working after an hour.
 * Older photos were saved as full public links to "avatars"; those keep working and are removed the same way.
 */
export type PhotoBucket = 'avatars' | 'post-photos' | 'pet-photos'

const linkLifetimeSeconds = 60 * 60

export interface PhotoMessages {
  /** The file can't be opened as a picture */
  unreadable: string
  /** The upload failed */
  failed: string
  /** The folder doesn't exist yet: a setup script hasn't been run */
  needsUpdate?: string
}

/** True for "<id>/<name>.jpg" (where a photo lives), false for an older full link */
export const isStoredPath = (stored: string) => !/^https?:\/\//i.test(stored)

/** Where an older photo lives, read from its public link ("…/storage/v1/object/public/avatars/<id>/pet-1.jpg") */
export function pathFromPublicLink(link: string): { bucket: string; path: string } | null {
  const match = link.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/)
  return match ? { bucket: match[1], path: decodeURIComponent(match[2]) } : null
}

/** A random name in the person's own folder, so nobody can guess where a photo is */
export const newPhotoPath = (userId: string) => `${userId}/${crypto.randomUUID()}.jpg`

/** Shrinks the photo and uploads it to the person's folder. Returns where it lives. */
export async function uploadPhoto(bucket: PhotoBucket, userId: string, photo: File, maxSide: number, messages: PhotoMessages): Promise<string> {
  let blob: Blob
  try {
    blob = await shrinkImage(photo, maxSide)
  } catch {
    throw new Error(messages.unreadable)
  }
  const path = newPhotoPath(userId)
  const { error } = await supabase.storage.from(bucket).upload(path, blob, { contentType: 'image/jpeg' })
  if (error) throw new Error(messages.needsUpdate && /bucket not found/i.test(error.message) ? messages.needsUpdate : messages.failed)
  return path
}

/** The public link for a photo in "avatars" */
export const publicLink = (path: string) => supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl

/**
 * Swaps where each private photo lives for a link that can be shown (for an hour). Older full links stay as they are.
 * A photo that can't be opened is left out, so the rest of the screen still shows.
 */
export async function withPhotoLinks<T extends { photo_url: string | null }>(bucket: PhotoBucket, items: T[]): Promise<T[]> {
  const paths = items.map((i) => i.photo_url).filter((u): u is string => !!u && isStoredPath(u))
  if (paths.length === 0) return items
  const { data } = await supabase.storage.from(bucket).createSignedUrls([...new Set(paths)], linkLifetimeSeconds)
  const links = new Map<string, string>()
  for (const item of data ?? []) if (item.path && item.signedUrl && !item.error) links.set(item.path, item.signedUrl)
  return items.map((i) => (i.photo_url && isStoredPath(i.photo_url) ? { ...i, photo_url: links.get(i.photo_url) ?? null } : i))
}

/**
 * Removes a photo that's no longer used (its post or pet was deleted, or a new photo replaced it).
 * If it can't be removed right now, nothing more is said: what the person did has already worked.
 */
export async function removePhoto(bucket: PhotoBucket, stored: string | null | undefined): Promise<void> {
  if (!stored) return
  if (isStoredPath(stored)) {
    await supabase.storage.from(bucket).remove([stored])
    return
  }
  const old = pathFromPublicLink(stored)
  if (old) await supabase.storage.from(old.bucket).remove([old.path])
}
