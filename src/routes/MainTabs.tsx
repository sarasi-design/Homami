import { AppLayout } from '../screens/AppLayout'
import { ChatsContent } from '../screens/Chat'
import { CircleContent, CirclePage, ExtendedCircleContent, HomeContent } from '../screens/CircleScreens'
import type { WallFilter, WallItem } from '../screens/CircleScreens'
import { NewPost } from '../screens/NewPost'
import { Sheet } from '../components/blocks/Sheet'
import { ComposerPrompt } from '../components/blocks/ComposerPrompt'
import type { ChatSummary } from '../lib/chat'
import type { CircleMember } from '../lib/circle'
import type { Pet } from '../lib/pets'
import { timeAgo } from '../lib/posts'
import type { NewPost as NewPostValues } from '../lib/posts'
import type { PostOnWall } from '../hooks/useWallPosts'
import type { RequestListing } from '../lib/requests'
import type { SitterListing } from '../lib/sitters'
import { buildWall, requestCards, sitterCards } from '../lib/wall'
import { go, goBack } from '../lib/router'

export interface MainTabsProps {
  route: string
  userId: string
  me: { name: string; photoUrl: string | null }
  myCity: string | null
  pets: Pet[]
  iAmSitter: boolean
  circle: CircleMember[] | undefined
  extended: CircleMember[] | undefined
  /** Your circle's posts, with yours that are still being saved on top (see useWallPosts) */
  posts: PostOnWall[] | undefined
  onPublish: (values: NewPostValues) => void
  onDeletePost: (post: PostOnWall) => Promise<void>
  sitters: SitterListing[] | undefined
  openRequests: RequestListing[] | undefined
  chats: ChatSummary[] | undefined
  chatsError: string | null
  unreadChats: number
  bookingsWaiting: number
  /** The wall's filter, kept while you visit other pages */
  wallFilter: WallFilter
  onWallFilter: (f: WallFilter) => void
  onTab: (tab: string) => void
  onLogOut: () => void
}

/** The three tabs with the bottom nav: Home (the wall), Circle (and Extended circle) and Chats. New post opens over the wall. */
export function MainTabs(p: MainTabsProps) {
  const { route, userId } = p
  const tab = route === '/circle' || route === '/circle/extended' ? 'circle' : route === '/chats' ? 'chats' : 'home'
  const newPostOpen = route === '/new-post'
  const goCircleView = (v: 'circle' | 'extended') => go(v === 'circle' ? '/circle' : '/circle/extended')
  const hasCircle = (p.circle?.length ?? 0) > 0
  const member = (m: CircleMember) => ({ id: m.id, name: m.first_name ?? 'New member', city: m.city, photoUrl: m.avatar_url, sharedCount: m.shared_count })

  const people = { circleIds: new Set(p.circle?.map((m) => m.id)), extendedIds: new Set(p.extended?.map((m) => m.id)), myCity: p.myCity }
  const postItems: WallItem[] =
    p.posts?.map((post) => ({
      kind: 'post' as const,
      id: post.id,
      authorName: post.author?.first_name ?? 'Someone',
      authorPhotoUrl: post.author?.avatar_url,
      city: post.author?.city,
      petName: post.pet?.name,
      body: post.body,
      photoUrl: post.photo_url,
      when: timeAgo(post.created_at),
      onDelete: post.author_id === userId ? () => p.onDeletePost(post) : undefined,
      status: post.status,
      problem: post.problem,
      onRetry: post.retry,
      onDiscard: post.discard,
    })) ?? []
  const wallItems =
    p.posts === undefined || p.sitters === undefined || p.openRequests === undefined
      ? undefined
      : buildWall(p.wallFilter, postItems, sitterCards(p.sitters, people), requestCards(p.openRequests, people))

  // New post shows on the wall straight away and is saved in the background
  const publish = (values: NewPostValues) => {
    p.onPublish(values)
    goBack()
  }

  return (
    <AppLayout
      me={p.me}
      bookingsWaiting={p.bookingsWaiting}
      tab={tab}
      onTab={p.onTab}
      onOpenProfile={() => go('/profile')}
      onLogOut={p.onLogOut}
      onHelp={() => go('/help')}
      unreadChats={p.unreadChats}
      headerMiddle={tab === 'home' ? <ComposerPrompt name={p.me.name} showAvatar={false} onOpen={() => go('/new-post')} /> : undefined}
    >
      {route === '/circle/extended' ? (
        <CirclePage view="extended" onView={goCircleView} showInvite={hasCircle} onInvite={() => go('/invite')}>
          <ExtendedCircleContent hasCircle={hasCircle} people={p.extended?.map(member)} onOpenPerson={(id) => go(`/people/${id}`)} />
        </CirclePage>
      ) : tab === 'chats' ? (
        <ChatsContent chats={p.chats} error={p.chatsError} onOpen={(id) => go(`/chats/${id}`)} />
      ) : tab === 'circle' ? (
        <CirclePage view="circle" onView={goCircleView} showInvite={hasCircle} onInvite={() => go('/invite')}>
          <CircleContent members={p.circle?.map(member)} onInvite={() => go('/invite')} onOpenPerson={(id) => go(`/people/${id}`)} />
        </CirclePage>
      ) : (
        <HomeContent
          hasCircle={hasCircle}
          items={wallItems}
          filter={p.wallFilter}
          onFilter={p.onWallFilter}
          iAmSitter={p.iAmSitter}
          onInvite={() => go('/invite')}
          onOpenSitter={(id) => go(`/people/${id}`)}
          onOpenRequest={(id) => go(`/people/${id}`)}
          onBecomeSitter={() => go('/sitter')}
        />
      )}
      <Sheet open={newPostOpen} onClose={goBack} label="New post">
        <NewPost variant="sheet" pets={p.pets.map((pet) => ({ id: pet.id, name: pet.name, photoUrl: pet.photo_url }))} onBack={goBack} onSubmit={publish} />
      </Sheet>
    </AppLayout>
  )
}
