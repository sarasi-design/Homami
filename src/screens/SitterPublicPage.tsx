import { MessageCircle, ThumbsUp } from 'lucide-react'
import { Button } from '../components/basics/Button'
import { Note } from '../components/basics/Note'
import { Logo } from '../components/brand/Logo'
import { ProfileHero } from '../components/blocks/ProfileHero'
import { OffersSection } from '../components/blocks/OffersSection'
import { RecommendedBy } from '../components/blocks/RecommendedBy'
import { RecommendationCard } from '../components/blocks/RecommendationCard'
import { Tag } from '../components/basics/Tag'
import { SwitchLink } from './WelcomeLayout'
import { availabilityLabel } from '../lib/sitters'
import { publicRecommendedLabel } from '../lib/recommendations'
import type { PublicSitterPage } from '../lib/recommendations'
import { whenLabel } from '../lib/reviews'

/**
 * A pet sitter's public page — what anyone sees when they open the sitter's link, with or without an account
 * (Sara, Nov 15, 2026; the "Share" step of Figma Chat+book 140:6880, built from the profile blocks).
 * Only: photo, first name, city, bio, what they offer and their prices, and their recommendations
 * (first names, photos, notes). Never their pets or posts, or the recommenders' pets.
 *   Contact Daniel · I've used Daniel, recommend → sign up (no code needed) or log in, then back to Daniel.
 */
export interface SitterPublicPageProps {
  /** undefined while loading, null when the link doesn't work */
  page: PublicSitterPage | null | undefined
  onContact: () => void
  onRecommend: () => void
  onLogIn: () => void
}

export function SitterPublicPage({ page, onContact, onRecommend, onLogIn }: SitterPublicPageProps) {
  const name = page?.first_name ?? 'this sitter'
  const label = page ? publicRecommendedLabel(page.recommendations.map((r) => r.first_name), page.recommend_count) : null
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
      <header className="flex flex-col items-center gap-s px-l pt-xl pb-l text-center">
        <Logo />
        <p className="text-label text-medium-grey">Find a pet sitter your friends already trust</p>
      </header>
      <div className="flex flex-1 flex-col gap-xl px-l pb-[40px]">
        {page === undefined ? null : page === null ? (
          <>
            <Note title="This link doesn’t work any more">The pet sitter may have stopped offering pet sitting, or the link was copied only in part.</Note>
            <SwitchLink question="On Homami?" action="Log in" onClick={onLogIn} />
          </>
        ) : (
          <>
            <ProfileHero
              name={name}
              photoUrl={page.avatar_url}
              city={page.city}
              bio={page.bio}
              status={<Tag color="sage" size="small">{availabilityLabel(page.sitter.available_from, page.sitter.available_until)}</Tag>}
            />
            {label && (
              <RecommendedBy
                label={label}
                people={page.recommendations.slice(0, 3).map((r) => ({ name: r.first_name ?? 'Homami member', photoUrl: r.avatar_url }))}
              />
            )}
            <div className="flex flex-col gap-s">
              <Button variant="neutral" fullWidth iconLeft={MessageCircle} onClick={onContact}>
                Contact {name}
              </Button>
              <Button variant="outline" fullWidth iconLeft={ThumbsUp} onClick={onRecommend}>
                I’ve used {name}, recommend
              </Button>
              <p className="text-center text-caption text-medium-grey">Free, and no invitation needed.</p>
            </div>

            <section className="flex flex-col gap-m">
              <h2 className="text-body text-dark-grey">Pet sitting</h2>
              <OffersSection sitter={page.sitter} />
            </section>

            <section aria-labelledby="recs-title" className="flex flex-col gap-m">
              <h2 id="recs-title" className="text-body text-dark-grey">
                Recommended by
              </h2>
              {page.recommendations.length > 0 ? (
                <div className="flex flex-col">
                  {page.recommendations.map((r, i) => (
                    <RecommendationCard key={`${r.created_at}-${i}`} name={r.first_name ?? 'Homami member'} photoUrl={r.avatar_url} when={whenLabel(r.created_at)} note={r.note} />
                  ))}
                </div>
              ) : (
                <p className="text-label text-medium-grey">No recommendations yet. Has {name} looked after your pets? Be the first.</p>
              )}
            </section>

            <div className="flex justify-center">
              <SwitchLink question="Already on Homami?" action="Log in" onClick={onLogIn} />
            </div>
          </>
        )}
      </div>
    </main>
  )
}
