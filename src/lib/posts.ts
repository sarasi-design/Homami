import { supabase } from './supabase'
import { shrinkImage } from './images'

/** The wall: your posts and your circle's, newest first. */

const offline = 'We couldn’t reach Homami. Check your connection and try again.'

export interface Post {
  id: string
  author_id: string
  body: string | null
  /** The link to show the photo with. For new posts it's a private link that works for an hour. */
  photo_url: string | null
  created_at: string
  author: { first_name: string | null; avatar_url: string | null; city: string | null } | null
  pet: { name: string; kind: string } | null
}

export interface NewPost {
  body: string
  petId: string | null
  photo: File | null
}

const columns = 'id, author_id, body, photo_url, created_at, author:profiles(first_name, avatar_url, city), pet:pets(name, kind)'

/**
 * Post photos live in the private "post-photos" folder (database script 16): only the person who posted
 * and their circle can open them, through links that stop working after an hour. The database keeps
 * where the photo lives ("<their id>/<random name>.jpg"); older posts kept a public link to "avatars".
 */
const photoBucket = 'post-photos'
const legacyBucket = 'avatars'
const linkLifetimeSeconds = 60 * 60
const photosNeedUpdate = 'Homami’s database needs an update for post photos (setup script 16). Please try again later.'

/** True for "<id>/<name>.jpg" (private folder), false for an older full link */
const isPrivatePhoto = (stored: string) => !/^https?:\/\//i.test(stored)

/** Where an older post's photo lives in "avatars", read from its public link */
function legacyPhotoPath(link: string): string | null {
  const marker = `/storage/v1/object/public/${legacyBucket}/`
  const at = link.indexOf(marker)
  return at === -1 ? null : decodeURIComponent(link.slice(at + marker.length))
}

/** Turns stored photo places into links that can be shown. A photo that can't be opened is left out. */
async function withPhotoLinks(posts: Post[]): Promise<Post[]> {
  const paths = posts.map((p) => p.photo_url).filter((u): u is string => !!u && isPrivatePhoto(u))
  if (paths.length === 0) return posts
  const { data } = await supabase.storage.from(photoBucket).createSignedUrls(paths, linkLifetimeSeconds)
  const links = new Map<string, string>()
  for (const item of data ?? []) if (item.path && item.signedUrl && !item.error) links.set(item.path, item.signedUrl)
  return posts.map((p) => (p.photo_url && isPrivatePhoto(p.photo_url) ? { ...p, photo_url: links.get(p.photo_url) ?? null } : p))
}

/** Uploads a post photo to your private folder and returns where it lives */
async function uploadPostPhoto(userId: string, photo: File): Promise<string> {
  let blob: Blob
  try {
    blob = await shrinkImage(photo, 1280)
  } catch {
    throw new Error('That photo couldn’t be opened. Try a different one.')
  }
  // A random name, so nobody can guess where a photo is
  const path = `${userId}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from(photoBucket).upload(path, blob, { contentType: 'image/jpeg' })
  if (error) throw new Error(/bucket not found/i.test(error.message) ? photosNeedUpdate : 'The photo didn’t upload. Try again.')
  return path
}

export async function listFeed(): Promise<Post[]> {
  const { data, error } = await supabase.from('posts').select(columns).order('created_at', { ascending: false }).limit(50)
  if (error) throw new Error(offline)
  return withPhotoLinks(data as unknown as Post[])
}

export async function createPost(userId: string, { body, petId, photo }: NewPost): Promise<Post> {
  const photoPath = photo ? await uploadPostPhoto(userId, photo) : null
  const { data, error } = await supabase
    .from('posts')
    .insert({ body: body || null, pet_id: petId, photo_url: photoPath })
    .select(columns)
    .single()
  if (error) {
    if (photoPath) await supabase.storage.from(photoBucket).remove([photoPath])
    throw new Error(offline)
  }
  const [post] = await withPhotoLinks([data as unknown as Post])
  return post
}

/** Removes a post, and its photo with it, so the photo isn't left behind */
export async function deletePost(id: string) {
  const { data, error } = await supabase.from('posts').delete().eq('id', id).select('photo_url').maybeSingle()
  if (error) throw new Error(offline)
  const stored = (data as { photo_url: string | null } | null)?.photo_url
  if (!stored) return
  // The post is already gone; if the photo can't be removed now, there's nothing more to tell the person
  if (isPrivatePhoto(stored)) await supabase.storage.from(photoBucket).remove([stored])
  else {
    const old = legacyPhotoPath(stored)
    if (old) await supabase.storage.from(legacyBucket).remove([old])
  }
}

/** "Just now", "5 min ago", "2h ago", "Yesterday", "3 days ago", then the date */
export function timeAgo(iso: string, now = new Date()): string {
  const then = new Date(iso)
  const minutes = Math.floor((now.getTime() - then.getTime()) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return then.toLocaleDateString(undefined, { day: 'numeric', month: 'short', ...(then.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}) })
}
