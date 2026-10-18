import { supabase } from './supabase'
import { shrinkImage } from './images'

/** The wall: your posts and your circle's, newest first. */

const offline = 'We couldn’t reach Homami. Check your connection and try again.'

export interface Post {
  id: string
  author_id: string
  body: string | null
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

export async function listFeed(): Promise<Post[]> {
  const { data, error } = await supabase.from('posts').select(columns).order('created_at', { ascending: false }).limit(50)
  if (error) throw new Error(offline)
  return data as unknown as Post[]
}

export async function createPost(userId: string, { body, petId, photo }: NewPost): Promise<Post> {
  let photoUrl: string | null = null
  if (photo) {
    let blob: Blob
    try {
      blob = await shrinkImage(photo, 1280)
    } catch {
      throw new Error('That photo couldn’t be opened. Try a different one.')
    }
    const path = `${userId}/post-${Date.now()}.jpg`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg' })
    if (uploadError) throw new Error('The photo didn’t upload. Try again.')
    photoUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
  }
  const { data, error } = await supabase
    .from('posts')
    .insert({ body: body || null, pet_id: petId, photo_url: photoUrl })
    .select(columns)
    .single()
  if (error) throw new Error(offline)
  return data as unknown as Post
}

export async function deletePost(id: string) {
  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) throw new Error(offline)
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
