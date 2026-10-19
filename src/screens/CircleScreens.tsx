import type { ReactNode } from 'react'
import { UserPlus } from 'lucide-react'
import { Avatar } from '../components/basics/Avatar'
import { Button } from '../components/basics/Button'
import { Note } from '../components/basics/Note'
import { Tag } from '../components/basics/Tag'
import { Tabs } from '../components/basics/Tabs'
import { OffersSection } from '../components/blocks/OffersSection'
import { SitterPostCard } from '../components/blocks/SitterPostCard'
import type { SitterPostCardProps } from '../components/blocks/SitterPostCard'
import { FilterChips } from '../components/basics/FilterChips'
import { availabilityLabel } from '../lib/sitters'
import type { SitterProfile } from '../lib/sitters'
import { Banner } from '../components/blocks/Banner'
import { EmptyState } from '../components/blocks/EmptyState'
import { Header } from '../components/blocks/Header'
import { InviteLinkCard } from '../components/blocks/InviteLinkCard'
import { PersonCard } from '../components/blocks/PersonCard'
import { PostCard } from '../components/blocks/PostCard'
import type { PostCardProps } from '../components/blocks/PostCard'
import { PetsSection } from '../components/blocks/PetsSection'
import type { PetSummary } from '../components/blocks/PetsSection'
import { ProfileHero } from '../components/blocks/ProfileHero'
import { Steps } from '../components/blocks/Steps'
import welcomeCatDog from '../assets/welcome-cat-dog.webp'

/* ---------------------------------------------------------------------------------------------
 * Home — Figma "Your circle's activity" (134:17763): the "What's new?" prompt, then the posts.
 * ------------------------------------------------------------------------------------------- */
export type WallFilter = 'all' | 'circle' | 'extended' | 'sitters'

export type WallItem =
  | ({ kind: 'post'; id: string } & PostCardProps)
  | ({ kind: 'sitter'; id: string } & Omit<SitterPostCardProps, 'onOpen'>)

export interface HomeContentProps {
  /** Posts and pet sitters, already in order and filtered */
  items: WallItem[] | undefined
  filter: WallFilter
  onFilter: (f: WallFilter) => void
  hasCircle: boolean
  /** Are you a pet sitter? If not, the Pet sitters filter shows a banner to become one */
  iAmSitter: boolean
  onInvite: () => void
  onOpenSitter: (id: string) => void
  onBecomeSitter: () => void
}

const WALL_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'circle', label: 'Circle' },
  { id: 'extended', label: 'Extended circle' },
  { id: 'sitters', label: 'Sitters' },
]

const emptyText: Record<WallFilter, { title: string; text: string }> = {
  all: { title: 'Nothing here yet', text: 'Share the first update about your pets. People in your circle will see it here, and you’ll see theirs.' },
  circle: { title: 'Nothing from your circle yet', text: 'When the people in your circle share updates or offer pet sitting, you’ll see them here.' },
  extended: { title: 'Nothing from your extended circle yet', text: 'Pet sitters among the friends of your friends will show up here.' },
  sitters: { title: 'No pet sitters yet', text: 'When someone on Homami offers pet sitting, you’ll find them here.' },
}

/**
 * Home — the wall (Figma "Your circle's activity", 134:17763). "What's new?" sits in the header next to
 * your photo (AppLayout headerMiddle); here: the title, the filters, then
 * your circle's posts with pet sitters in between (white cards with a sage border). With no circle yet, it's all sitters,
 * nearest first.
 */
export function HomeContent({ items, filter, onFilter, hasCircle, iAmSitter, onInvite, onOpenSitter, onBecomeSitter }: HomeContentProps) {
  return (
    <>
      <h1 className="text-title text-dark-grey">Your circle’s activity</h1>
      {/* The filters stick right under the header while the wall scrolls */}
      <div className="sticky top-[80px] z-10 -mx-l -my-s bg-surface px-l py-s">
        <FilterChips label="Show on your wall" options={WALL_FILTERS} value={filter} onChange={(f) => onFilter(f as WallFilter)} />
      </div>
      {items === undefined ? null : items.length === 0 ? (
        <EmptyState title={emptyText[filter].title}>{emptyText[filter].text}</EmptyState>
      ) : (
        <ul className="flex flex-col gap-l">
          {items.map((item) =>
            item.kind === 'post' ? (
              <li key={`p-${item.id}`} className="border-b border-light-grey last:border-b-0">
                <PostCard {...item} />
              </li>
            ) : (
              <li key={`s-${item.id}`} className="pb-l">
                <SitterPostCard {...item} onOpen={() => onOpenSitter(item.id)} />
              </li>
            ),
          )}
        </ul>
      )}
      {filter === 'sitters' && !iAmSitter && (
        <Banner
          tone="bubble"
          title="Happy to look after other people’s pets?"
          action={
            <Button variant="dark" size="small" className="self-start" onClick={onBecomeSitter}>
              Add services
            </Button>
          }
        />
      )}
      {!hasCircle && (filter === 'all' || filter === 'circle') && (
        <Banner
          title="Share Homami with people you trust"
          image={welcomeCatDog}
          action={
            <Button variant="dark" size="small" iconLeft={UserPlus} onClick={onInvite} className="self-start">
              Invite friends
            </Button>
          }
        />
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
      {members === undefined ? null : members.length === 0 ? (
        <>
          <EmptyState title="Your circle is empty for now" image={null}>
            Invite friends and family you trust. When they join with your link, you’ll see each other here.
          </EmptyState>
          <Banner
            title="Share Homami with people you trust"
            image={welcomeCatDog}
            action={
              <Button variant="dark" size="small" iconLeft={UserPlus} onClick={onInvite} className="self-start">
                Invite friends
              </Button>
            }
          />
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
 * The Circle page — Figma 134:18457: "Your circle" + Invite friends, then Tabs:
 * Your circle · Extended circle (friends of the people in your circle).
 * Left for later: search and the map pin.
 * ------------------------------------------------------------------------------------------- */
export type CircleView = 'circle' | 'extended'

export interface CirclePageProps {
  view: CircleView
  onView: (v: CircleView) => void
  /** Shows the Invite friends button top-right (hidden while your circle is empty: the banner has it) */
  showInvite: boolean
  onInvite: () => void
  children: ReactNode
}

export function CirclePage({ view, onView, showInvite, onInvite, children }: CirclePageProps) {
  return (
    <>
      <div className="flex items-center justify-between gap-m">
        <h1 className="text-title text-dark-grey">Your circle</h1>
        {showInvite && (
          <Button variant="outline" size="small" onClick={onInvite}>
            Invite friends
          </Button>
        )}
      </div>
      {/* Stays under the header while the list scrolls */}
      <div className="sticky top-[80px] z-10 -mx-l -my-s bg-surface px-l py-s">
        <Tabs
          label="Circle"
          tabs={[
            { id: 'circle', label: 'Your circle' },
            { id: 'extended', label: 'Extended circle' },
          ]}
          value={view}
          onChange={(v) => onView(v as CircleView)}
          className="-mx-xs"
        />
      </div>
      <div role="tabpanel" id={`panel-${view}`} aria-labelledby={`tab-${view}`} className="flex flex-col gap-l">
        {children}
      </div>
    </>
  )
}

/* ---------------------------------------------------------------------------------------------
 * Extended circle — people your circle knows. Same PersonCard; "Shared circle" = how many of
 * your circle know them. Their profile opens read-only, without pets or posts.
 * ------------------------------------------------------------------------------------------- */
export interface ExtendedCircleContentProps {
  people: { id: string; name: string; city?: string | null; photoUrl?: string | null; sharedCount: number }[] | undefined
  hasCircle: boolean
  onOpenPerson: (id: string) => void
}

export function ExtendedCircleContent({ people, hasCircle, onOpenPerson }: ExtendedCircleContentProps) {
  if (people === undefined) return null
  if (people.length === 0) {
    return (
      <EmptyState title="No one here yet" image={null}>
        {hasCircle
          ? 'When the people in your circle connect with their friends, they’ll show up here.'
          : 'This is where friends of your friends show up, once your circle starts growing.'}
      </EmptyState>
    )
  }
  return (
    <>
      <p className="text-label text-medium-grey">Friends of the people in your circle.</p>
      <ul className="flex flex-col gap-l">
        {people.map((m) => (
          <li key={m.id}>
            <PersonCard name={m.name} city={m.city} photoUrl={m.photoUrl} sharedCount={m.sharedCount} onOpen={() => onOpenPerson(m.id)} />
          </li>
        ))}
      </ul>
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
        <Banner title="Share Homami with people you trust" image={welcomeCatDog} />
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
  /** Only for people in your circle; pass null for a pet sitter you don't know yet */
  pets: PetSummary[] | undefined | null
  /** Their pet sitter profile, if they offer pet sitting */
  sitter?: SitterProfile | null
  onBack: () => void
}

export function PersonPage({ person, pets, sitter, onBack }: PersonPageProps) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
      <Header onBack={onBack} />
      <main className="flex flex-col gap-xl px-l pb-[40px]">
        {person === null ? (
          <Note title="This profile isn’t available">They may have left your circle or stopped offering pet sitting.</Note>
        ) : person === undefined ? null : (
          <>
            <ProfileHero
              name={person.name}
              photoUrl={person.photoUrl}
              city={person.city}
              bio={person.bio}
              status={sitter ? <Tag color="sage" size="small">{availabilityLabel(sitter.available_from)}</Tag> : undefined}
            />
            {sitter && (
              <section className="flex flex-col gap-m">
                <h2 className="text-body text-dark-grey">Pet sitting</h2>
                <OffersSection sitter={sitter} />
                <Note>Messaging pet sitters is coming soon.</Note>
              </section>
            )}
            {pets !== null && (
              <section className="flex flex-col gap-m">
                <h2 className="text-body text-dark-grey">{person.name}’s pets</h2>
                {pets && pets.length > 0 ? <PetsSection pets={pets} /> : pets ? <Note>No pets added yet.</Note> : null}
              </section>
            )}
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
