import { useCallback, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { createPost, deletePost } from '../lib/posts'
import type { NewPost, Post } from '../lib/posts'
import type { Pet } from '../lib/pets'
import { OFFLINE } from '../lib/errors'

/** A post as the wall shows it: saved, being saved, or with something that didn't work */
export interface PostOnWall extends Post {
  status?: 'posting' | 'failed'
  problem?: string | null
  retry?: () => void
  discard?: () => void
}

interface Pending {
  localId: string
  values: NewPost
  /** What shows straight away, made from what you wrote (the photo from your phone) */
  preview: Post
  /** Once it's saved */
  saved: Post | null
  status: 'posting' | 'failed'
  problem: string | null
}

interface Me {
  name: string
  photoUrl: string | null
  city: string | null
}

/** A short note for under the post: "We couldn't reach Homami", without the "try again" (the link is right there) */
const problemOf = (err: unknown) => {
  const message = err instanceof Error ? err.message : ''
  if (!message || message === OFFLINE) return 'We couldn’t reach Homami'
  return message.replace(/\.$/, '')
}

/**
 * Posting and deleting on the wall happen straight away, like sending a chat message (optimistic updates):
 *   New post   shows at the top at once, faded with "Posting…", until it's saved. If it doesn't post,
 *              it says so, with Try again and Remove.
 *   Delete     the post goes at once. If deleting doesn't work, it comes back with a note and Try again.
 * The wall loads again whenever Home opens; posts still being saved stay on top until the new list has them.
 */
export function useWallPosts(userId: string, me: Me, pets: Pet[], feed: Post[] | undefined, setFeed: Dispatch<SetStateAction<Post[] | undefined>>) {
  const [pending, setPending] = useState<Pending[]>([])
  /** Posts being deleted ('hidden'), or the problem when deleting didn't work */
  const [deleting, setDeleting] = useState<Record<string, 'hidden' | string>>({})

  const update = (localId: string, change: Partial<Pending>) =>
    setPending((list) => list.map((p) => (p.localId === localId ? { ...p, ...change } : p)))

  const save = useCallback(
    async (localId: string, values: NewPost, preview: Post) => {
      try {
        const saved = await createPost(userId, values)
        setPending((list) => list.map((p) => (p.localId === localId ? { ...p, saved } : p)))
        setFeed((list) => [saved, ...(list ?? []).filter((x) => x.id !== saved.id)])
        if (preview.photo_url) URL.revokeObjectURL(preview.photo_url)
      } catch (err) {
        setPending((list) => list.map((p) => (p.localId === localId ? { ...p, status: 'failed', problem: problemOf(err) } : p)))
      }
    },
    [userId, setFeed],
  )

  const publish = (values: NewPost) => {
    const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const pet = values.petId ? pets.find((p) => p.id === values.petId) : undefined
    const preview: Post = {
      id: localId,
      author_id: userId,
      body: values.body || null,
      photo_url: values.photo ? URL.createObjectURL(values.photo) : null,
      created_at: new Date().toISOString(),
      author: { first_name: me.name, avatar_url: me.photoUrl, city: me.city },
      pet: pet ? { name: pet.name, kind: pet.kind } : null,
    }
    setPending((list) => [{ localId, values, preview, saved: null, status: 'posting', problem: null }, ...list])
    void save(localId, values, preview)
  }

  const retry = (p: Pending) => {
    update(p.localId, { status: 'posting', problem: null })
    void save(p.localId, p.values, p.preview)
  }

  const discard = (p: Pending) => {
    if (p.preview.photo_url) URL.revokeObjectURL(p.preview.photo_url)
    setPending((list) => list.filter((x) => x.localId !== p.localId))
  }

  const remove = async (post: Post) => {
    setDeleting((d) => ({ ...d, [post.id]: 'hidden' }))
    try {
      await deletePost(post.id)
      setFeed((list) => list?.filter((x) => x.id !== post.id))
      setPending((list) => list.filter((p) => p.saved?.id !== post.id))
      setDeleting(({ [post.id]: _gone, ...rest }) => rest)
    } catch (err) {
      setDeleting((d) => ({ ...d, [post.id]: `Not deleted. ${problemOf(err)}` }))
    }
  }

  // New posts not in the wall's list yet, then the wall
  const posts: PostOnWall[] | undefined =
    feed === undefined
      ? undefined
      : [
          ...pending
            .filter((p) => !(p.saved && feed.some((f) => f.id === p.saved!.id)))
            .map((p): PostOnWall => (p.saved ? p.saved : { ...p.preview, status: p.status, problem: p.problem, retry: () => retry(p), discard: () => discard(p) })),
          ...feed,
        ]
          .filter((post) => deleting[post.id] !== 'hidden')
          .map((post) => (deleting[post.id] ? { ...post, status: 'failed' as const, problem: deleting[post.id], retry: () => void remove(post) } : post))

  return { posts, publish, remove }
}
