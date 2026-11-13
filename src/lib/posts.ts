import { supabase } from './supabase'
import { z } from 'zod'
import { many, maybeOne, one, photoOnly, text } from './check'
import { databaseError, needsUpdate } from './errors'
import { removePhoto, uploadPhoto, withPhotoLinks } from './photos'

/** The wall: your posts and your circle's, newest first. */

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

/** What a post looks like when it comes back from the database */
const postSchema: z.ZodType<Post> = z.object({
  id: z.string(),
  author_id: z.string(),
  body: text,
  photo_url: text,
  created_at: z.string(),
  author: z.object({ first_name: text, avatar_url: text, city: text }).nullable(),
  pet: z.object({ name: z.string(), kind: z.string() }).nullable(),
})

export interface NewPost {
  body: string
  petId: string | null
  photo: File | null
}

/** Post photos are private: you and your circle (database script 16, see photos.ts) */
const photoMessages = {
  unreadable: 'That photo couldn’t be opened. Try a different one.',
  failed: 'The photo didn’t upload. Try again.',
  needsUpdate: needsUpdate('post photos', 'script 16'),
}

const columns = 'id, author_id, body, photo_url, created_at, author:profiles(first_name, avatar_url, city), pet:pets(name, kind)'

export async function listFeed(): Promise<Post[]> {
  const { data, error } = await supabase.from('posts').select(columns).order('created_at', { ascending: false }).limit(50)
  if (error) throw databaseError(error)
  return withPhotoLinks('post-photos', many(postSchema, data, 'the wall'))
}

export async function createPost(userId: string, { body, petId, photo }: NewPost): Promise<Post> {
  const photoPath = photo ? await uploadPhoto('post-photos', userId, photo, 1280, photoMessages) : null
  const { data, error } = await supabase
    .from('posts')
    .insert({ body: body || null, pet_id: petId, photo_url: photoPath })
    .select(columns)
    .single()
  if (error) {
    await removePhoto('post-photos', photoPath)
    throw databaseError(error)
  }
  const [post] = await withPhotoLinks('post-photos', [one(postSchema, data, 'your new post')])
  return post
}

/** Removes a post, and its photo with it, so the photo isn't left behind */
export async function deletePost(id: string) {
  const { data, error } = await supabase.from('posts').delete().eq('id', id).select('photo_url').maybeSingle()
  if (error) throw databaseError(error)
  await removePhoto('post-photos', maybeOne(photoOnly, data, 'a removed post')?.photo_url)
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
