import type { ReactNode } from 'react'
import { CalendarCheck, Heart, MessageCircle, Pencil, ThumbsUp, UserPlus } from 'lucide-react'
import { Avatar } from '../components/basics/Avatar'
import { Button } from '../components/basics/Button'
import { Note } from '../components/basics/Note'
import { Tag } from '../components/basics/Tag'
import { Tabs } from '../components/basics/Tabs'
import { OffersSection } from '../components/blocks/OffersSection'
import { RequestCard } from '../components/blocks/RequestCard'
import { RecommendedBy } from '../components/blocks/RecommendedBy'
import { RecommendationCard } from '../components/blocks/RecommendationCard'
import { petsLine, recRelation } from '../lib/recommendations'
import type { Recommendation } from '../lib/recommendations'
import { ReviewCard, ReviewSummary as ReviewSummaryCard } from '../components/blocks/ReviewCard'
import { closenessLabel, recommendedByLabel, whenLabel } from '../lib/reviews'
import type { ReviewSummary, SitterReview } from '../lib/reviews'
import type { CareRequest } from '../lib/requests'
import { SitterPostCard } from '../components/blocks/SitterPostCard'
import { RequestPostCard } from '../components/blocks/RequestPostCard'
import type { RequestPostCardProps } from '../components/blocks/RequestPostCard'
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
export type WallFilter = 'all' | 'circle' | 'extended' | 'sitters' | 'requests'

export type WallItem =
  | ({ kind: 'post'; id: string } & PostCardProps)
  | ({ kind: 'sitter'; id: string } & Omit<SitterPostCardProps, 'onOpen'>)
  /** id is the request; ownerId opens their profile */
  | ({ kind: 'request'; id: string; ownerId: string } & Omit<RequestPostCardProps, 'onOpen'>)

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
  /** Someone asking for pet care: opens their profile */
  onOpenRequest: (ownerId: string) => void
  onBecomeSitter: () => void
  /** Sitters who joined with your invite and you haven't recommended yet (database script 20) */
  toRecommend?: { id: string; name: string }[]
  onRecommend?: (id: string) => void
  /** "Already have a sitter you love? Invite them to Homami", under the Sitters filter */
  onInviteSitter?: () => void
}

const WALL_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'circle', label: 'Circle' },
  { id: 'extended', label: 'Extended circle' },
  { id: 'sitters', label: 'Sitters' },
  { id: 'requests', label: 'Needs help' },
]

const emptyText: Record<WallFilter, { title: string; text: string }> = {
  all: { title: 'Nothing here yet', text: 'Share the first update about your pets. People in your circle will see it here, and you’ll see theirs.' },
  circle: { title: 'Nothing from your circle yet', text: 'When the people in your circle share updates, offer pet sitting or need help with their pets, you’ll see them here.' },
  extended: { title: 'Nothing from your extended circle yet', text: 'Pet sitters, and people who need help with their pets, among the friends of your friends will show up here.' },
  sitters: { title: 'No pet sitters yet', text: 'When someone on Homami offers pet sitting, you’ll find them here, with the people who recommend them.' },
  requests: { title: 'Nobody needs help right now', text: 'When someone asks for help with their pets, you’ll find them here.' },
}

/**
 * Home — the wall (Figma "Your circle's activity", 134:17763). "What's new?" sits in the header next to
 * your photo (AppLayout headerMiddle); here: the title, the filters, then
 * your circle's posts with pet sitters (white cards, sage border) and people asking for pet care (white cards, peach border)
 * in between. With no circle yet, it's all sitters and requests, nearest first. "Needs help" shows only the requests.
 */
export function HomeContent({ items, filter, onFilter, hasCircle, iAmSitter, onInvite, onOpenSitter, onOpenRequest, onBecomeSitter, toRecommend = [], onRecommend, onInviteSitter }: HomeContentProps) {
  return (
    <>
      <h1 className="text-title text-dark-grey">Your circle’s activity</h1>
      {onRecommend &&
        toRecommend.slice(0, 1).map((s) => (
          <Banner
            key={s.id}
            tone="bubble"
            title={`${s.name} is on Homami now. Would you recommend them?`}
            action={
              <Button variant="dark" size="small" iconLeft={ThumbsUp} className="self-start" onClick={() => onRecommend(s.id)}>
                Recommend {s.name}
              </Button>
            }
          />
        ))}
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
            ) : item.kind === 'request' ? (
              <li key={`r-${item.id}`} className="pb-l">
                <RequestPostCard {...item} onOpen={() => onOpenRequest(item.ownerId)} />
              </li>
            ) : (
              <li key={`s-${item.id}`} className="pb-l">
                <SitterPostCard {...item} onOpen={() => onOpenSitter(item.id)} />
              </li>
            ),
          )}
        </ul>
      )}
      {filter === 'sitters' && onInviteSitter && (
        <Banner
          title="Already have a sitter you love?"
          action={
            <Button variant="dark" size="small" iconLeft={UserPlus} className="self-start" onClick={onInviteSitter}>
              Invite them to Homami
            </Button>
          }
        />
      )}
      {(filter === 'sitters' || filter === 'requests') && !iAmSitter && (
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
          title="Invite friends to see the sitters they trust"
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
            Invite friends and family you trust. When they join with your link, you’ll see each other here, and the sitters they recommend.
          </EmptyState>
          <Banner
            title="Invite friends to see the sitters they trust"
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
 * `forSitter` (Sara, Nov 15): "Invite your sitter" — an owner brings the sitter they already use. Same personal
 * link (they join your circle), with a message for the sitter; once they've set up, you're asked to recommend them.
 * ------------------------------------------------------------------------------------------- */
export interface InviteFriendsProps {
  link: string | null
  code?: string | null
  onBack: () => void
  /** Invite your own pet sitter: the message to send with the link */
  forSitter?: { shareText: string }
}

export function InviteFriends({ link, code, onBack, forSitter }: InviteFriendsProps) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
      <Header onBack={onBack} />
      <main className="flex flex-col gap-l px-l pt-s pb-[40px]">
        <h1 className="text-title text-dark-grey">{forSitter ? 'Invite your sitter' : 'Invite friends'}</h1>
        <p className="text-label-light text-dark-grey">
          {forSitter
            ? 'Bring the sitter you already trust. Once they’re on Homami, you can recommend them, and your friends will find them.'
            : 'Find pet sitters your friends already trust, and recommend yours. Invite the friends and family whose word you trust.'}
        </p>
        {!forSitter && <Banner title="Find sitters through people you trust" image={welcomeCatDog} />}
        {link && (forSitter ? <InviteLinkCard link={link} shareText={forSitter.shareText} /> : <InviteLinkCard link={link} code={code ?? undefined} />)}
        <Steps
          title="How it works"
          steps={
            forSitter
              ? [
                  'Your sitter opens your link and signs up to Homami',
                  'They set up their pet sitter profile, and join your circle',
                  'Homami asks you to recommend them, so your friends can find them',
                ]
              : [
                  'Your friend receives your personal invite link and signs up to Homami',
                  'They are automatically added to your circle when they join',
                  'You see the sitters they trust and recommend, and they see yours',
                ]
          }
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
  /** Shows the Message button (people in your circle and pet sitters) */
  onMessage?: () => void
  /** Their open pet care requests (database script 10) */
  requests?: CareRequest[]
  /** Shows "Book" next to Message, for pet sitters (database script 11) */
  onBook?: () => void
  /** Pet sitters' reviews (database script 16): the numbers everyone sees… */
  reviewSummary?: ReviewSummary | null
  /** …and the reviews you may read: yours, your circle's and your extended circle's */
  reviews?: SitterReview[]
  /** "Write a review" (after a finished booking) or "Edit your review" */
  review?: { label: string; onClick: () => void }
  /** Pet sitters' recommendations (database script 20), people you know first */
  recommendations?: Recommendation[]
  /** "Recommend" (anyone who has used them) or "Edit yours" */
  recommend?: { label: string; onClick: () => void; done: boolean }
}

export function PersonPage({ person, pets, sitter, onBack, onMessage, requests, onBook, reviewSummary, reviews, review, recommendations, recommend }: PersonPageProps) {
  const recommendedLabel = reviewSummary ? recommendedByLabel(reviewSummary) : null
  const recommendedPeople = (reviewSummary?.known_recommenders ?? []).map((p) => ({ name: p.first_name ?? 'Homami member', photoUrl: p.avatar_url }))
  const hiddenCount = (reviewSummary?.review_count ?? 0) - (reviews?.length ?? 0)
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
              status={sitter ? <Tag color="sage" size="small">{availabilityLabel(sitter.available_from, sitter.available_until)}</Tag> : undefined}
            />
            {sitter && recommendedLabel && <RecommendedBy label={recommendedLabel} people={recommendedPeople} />}
            {(onMessage || onBook || (recommend && !recommend.done)) && (
              <div className="flex flex-wrap gap-m">
                {onBook && (
                  <Button variant="primary" iconLeft={CalendarCheck} onClick={onBook}>
                    Book
                  </Button>
                )}
                {onMessage && (
                  <Button variant={onBook ? 'outline' : 'neutral'} iconLeft={MessageCircle} onClick={onMessage}>
                    Message
                  </Button>
                )}
                {recommend && !recommend.done && (
                  <Button variant="outline" iconLeft={ThumbsUp} onClick={recommend.onClick}>
                    {recommend.label}
                  </Button>
                )}
              </div>
            )}
            {requests && requests.length > 0 && (
              <section className="flex flex-col gap-m">
                <h2 className="text-body text-dark-grey">Needs pet care</h2>
                {requests.map((r) => (
                  <RequestCard
                    key={r.id}
                    title={`${person.name} needs`}
                    needs={r.needs}
                    startDate={r.start_date}
                    endDate={r.end_date}
                    area={r.area}
                    pets={pets?.filter((p) => r.pet_ids.includes(p.id))}
                    petCount={r.pet_count}
                  />
                ))}
              </section>
            )}
            {sitter && (
              <section className="flex flex-col gap-m">
                <h2 className="text-body text-dark-grey">Pet sitting</h2>
                <OffersSection sitter={sitter} />
              </section>
            )}
            {sitter && (recommend || (recommendations && recommendations.length > 0)) && (
              <section aria-labelledby="recs-title" className="flex flex-col gap-m">
                <div className="flex items-center justify-between gap-s">
                  <h2 id="recs-title" className="text-body text-dark-grey">
                    Recommended by
                  </h2>
                  {recommend?.done && (
                    <Button variant="ghost" size="small" iconLeft={Pencil} onClick={recommend.onClick}>
                      {recommend.label}
                    </Button>
                  )}
                </div>
                {recommendations && recommendations.length > 0 ? (
                  <div className="flex flex-col">
                    {recommendations.map((r) => (
                      <RecommendationCard
                        key={r.author_id}
                        name={r.closeness === 0 ? 'You' : (r.first_name ?? 'Homami member')}
                        photoUrl={r.avatar_url}
                        relation={recRelation(r.closeness)}
                        when={whenLabel(r.updated_at)}
                        pets={petsLine(r.pet_names)}
                        note={r.note}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-label text-medium-grey">No recommendations yet. Has {person.name} looked after your pets? Be the first to recommend them.</p>
                )}
              </section>
            )}
            {sitter && (
              <section aria-labelledby="reviews-title" className="flex flex-col gap-m">
                <div className="flex items-center justify-between gap-s">
                  <h2 id="reviews-title" className="text-body text-dark-grey">
                    Reviews
                  </h2>
                  {review && (
                    <Button variant="ghost" size="small" iconLeft={review.label.startsWith('Edit') ? Pencil : Heart} onClick={review.onClick}>
                      {review.label}
                    </Button>
                  )}
                </div>
                {reviewSummary && reviewSummary.review_count > 0 ? (
                  <>
                    <ReviewSummaryCard
                      ratingAvg={reviewSummary.rating_avg}
                      reviewCount={reviewSummary.review_count}
                      recommended={
                        reviewSummary.recommend_count > 0 ? (
                          <span className="text-label text-dark-sage">
                            {reviewSummary.recommend_count} {reviewSummary.recommend_count === 1 ? 'person recommends' : 'people recommend'} {person.name}
                          </span>
                        ) : undefined
                      }
                    />
                    {reviews && reviews.length > 0 && (
                      <div className="flex flex-col">
                        {reviews.map((r) => (
                          <ReviewCard
                            key={r.author_id}
                            name={r.closeness === 0 ? 'You' : (r.first_name ?? 'Homami member')}
                            photoUrl={r.avatar_url}
                            relation={r.closeness === 0 ? '' : closenessLabel(r.closeness)}
                            when={whenLabel(r.updated_at)}
                            city={r.city}
                            rating={r.rating}
                            recommends={r.recommend ? person.name : undefined}
                            body={r.body}
                          />
                        ))}
                      </div>
                    )}
                    {hiddenCount > 0 && (
                      <p className="text-caption text-medium-grey">
                        {hiddenCount === reviewSummary.review_count ? 'These reviews are' : `${hiddenCount} more ${hiddenCount === 1 ? 'review is' : 'reviews are'}`} from people outside
                        your circle and theirs, so you only see the hearts.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-label text-medium-grey">No reviews yet. People who book {person.name} through Homami can review them afterwards.</p>
                )}
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
