import { UserPlus } from 'lucide-react'
import { Avatar } from '../components/basics/Avatar'
import { Button } from '../components/basics/Button'
import { Note } from '../components/basics/Note'
import { Banner } from '../components/blocks/Banner'
import { Header } from '../components/blocks/Header'
import { InviteLinkCard } from '../components/blocks/InviteLinkCard'
import { PersonCard } from '../components/blocks/PersonCard'
import { PostCard } from '../components/blocks/PostCard'
import type { PostCardProps } from '../components/blocks/PostCard'
import { ComposerPrompt } from '../components/blocks/ComposerPrompt'
import { PetsSection } from '../components/blocks/PetsSection'
import type { PetSummary } from '../components/blocks/PetsSection'
import { ProfileHero } from '../components/blocks/ProfileHero'
import { Steps } from '../components/blocks/Steps'
import welcomeCatDog from '../assets/welcome-cat-dog.webp'

/* ---------------------------------------------------------------------------------------------
 * Home — Figma "Your circle's activity" (134:17763): the "What's new?" prompt, then the posts.
 * ------------------------------------------------------------------------------------------- */
export interface HomeContentProps {
  me: { name: string; photoUrl?: string | null }
  posts: (PostCardProps & { id: string })[] | undefined
  hasCircle: boolean
  onNewPost: () => void
  onInvite: () => void
}

export function HomeContent({ me, posts, hasCircle, onNewPost, onInvite }: HomeContentProps) {
  return (
    <>
      <h1 className="text-title text-dark-grey">Your circle’s activity</h1>
      <ComposerPrompt name={me.name} photoUrl={me.photoUrl} onOpen={onNewPost} />
      {posts === undefined ? null : posts.length === 0 ? (
        <Note title="Nothing here yet">
          Share the first update about your pets. People in your circle will see it here, and you’ll see theirs.
        </Note>
      ) : (
        <ul className="flex flex-col gap-l">
          {posts.map((post) => (
            <li key={post.id} className="border-b border-light-grey last:border-b-0">
              <PostCard {...post} />
            </li>
          ))}
        </ul>
      )}
      {!hasCircle && (
        <>
          <Banner title={<>Share Homami<br />with people you trust</>} image={welcomeCatDog} />
          <Button variant="outline" iconLeft={UserPlus} onClick={onInvite} className="self-center">
            Invite friends
          </Button>
        </>
      )}
    </>
  )
}

/* ---------------------------------------------------------------------------------------------
 * Your circle — Figma 134:18457, v1: the list of people, and Invite friends.
 * ------------------------------------------------------------------------------------------- */
export interface CircleContentProps {
  members: { id: string; name: string; city?: string | null; photoUrl?: string | null; sharedCount: number }[] | undefined
  onInvite: () => void
  onOpenPerson: (id: string) => void
}

export function CircleContent({ members, onInvite, onOpenPerson }: CircleContentProps) {
  return (
    <>
      <div className="flex items-center justify-between gap-m">
        <h1 className="text-title text-dark-grey">Your circle</h1>
        <Button variant="outline" size="small" onClick={onInvite}>
          Invite friends
        </Button>
      </div>
      {members === undefined ? null : members.length === 0 ? (
        <>
          <Note title="Your circle is empty for now">
            Invite friends and family you trust. When they join with your link, you’ll see each other here.
          </Note>
          <Button variant="neutral" iconLeft={UserPlus} onClick={onInvite} className="self-center">
            Invite friends
          </Button>
        </>
      ) : (
        <ul className="flex flex-col gap-l">
          {members.map((m) => (
            <li key={m.id}>
              <PersonCard name={m.name} city={m.city} photoUrl={m.photoUrl} sharedCount={m.sharedCount} onOpen={() => onOpenPerson(m.id)} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

/* ---------------------------------------------------------------------------------------------
 * Invite friends — Figma 250:128185.
 * ------------------------------------------------------------------------------------------- */
export function InviteFriends({ link, onBack }: { link: string | null; onBack: () => void }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
      <Header onBack={onBack} />
      <main className="flex flex-col gap-l px-l pt-s pb-[40px]">
        <h1 className="text-title text-dark-grey">Invite friends</h1>
        <p className="text-label-light text-dark-grey">
          Homami is better with people you know. Invite friends and family to build your circle of trust.
        </p>
        <Banner title={<>Share Homami<br />with people you trust</>} image={welcomeCatDog} />
        {link && <InviteLinkCard link={link} />}
        <Steps
          title="How it works"
          steps={[
            'Your friend receives your personal invite link and signs up to Homami',
            'They are automatically added to your circle when they join',
            'You can start exchanging pet care and recommendations and building trust together',
          ]}
        />
      </main>
    </div>
  )
}

/* ---------------------------------------------------------------------------------------------
 * Someone in your circle — read-only profile: hero and their pets.
 * ------------------------------------------------------------------------------------------- */
export interface PersonPageProps {
  person: { name: string; photoUrl?: string | null; city?: string | null; bio?: string | null } | null | undefined
  pets: PetSummary[] | undefined
  onBack: () => void
}

export function PersonPage({ person, pets, onBack }: PersonPageProps) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
      <Header onBack={onBack} />
      <main className="flex flex-col gap-xl px-l pb-[40px]">
        {person === null ? (
          <Note title="This profile isn’t available">They may have left your circle.</Note>
        ) : person === undefined ? null : (
          <>
            <ProfileHero name={person.name} photoUrl={person.photoUrl} city={person.city} bio={person.bio} />
            <section className="flex flex-col gap-m">
              <h2 className="text-body text-dark-grey">{person.name}’s pets</h2>
              {pets && pets.length > 0 ? <PetsSection pets={pets} /> : pets ? <Note>No pets added yet.</Note> : null}
            </section>
          </>
        )}
      </main>
    </div>
  )
}

/* ---------------------------------------------------------------------------------------------
 * "Add Sara to your circle?" — when someone who already has an account opens an invite link.
 * ------------------------------------------------------------------------------------------- */
export interface JoinCircleProps {
  inviter: { name: string; photoUrl?: string | null }
  busy?: boolean
  error?: string | null
  onAccept: () => void
  onDecline: () => void
}

export function JoinCircle({ inviter, busy, error, onAccept, onDecline }: JoinCircleProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-center gap-xl bg-surface px-l text-center">
      <Avatar size="xlarge" name={inviter.name} src={inviter.photoUrl ?? undefined} />
      <div className="flex flex-col gap-s">
        <h1 className="text-title-large text-dark-sage">Add {inviter.name} to your circle?</h1>
        <p className="text-body text-medium-grey">You’ll see each other’s profiles and pets.</p>
      </div>
      {error && <p role="alert" className="text-label text-error">{error}</p>}
      <div className="flex flex-col items-center gap-s">
        <Button variant="neutral" onClick={onAccept} disabled={busy} aria-busy={busy || undefined}>
          {busy ? 'Adding…' : 'Add to my circle'}
        </Button>
        <Button variant="ghost" size="small" onClick={onDecline} disabled={busy}>
          Not now
        </Button>
      </div>
    </main>
  )
}
