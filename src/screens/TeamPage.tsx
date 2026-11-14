import { Avatar } from '../components/basics/Avatar'
import { Note } from '../components/basics/Note'
import { Tag } from '../components/basics/Tag'
import { Header } from '../components/blocks/Header'
import { StatTile } from '../components/blocks/StatTile'
import { PLACE_LABELS } from '../lib/admin'
import type { InterestTap, TeamMember, TeamOverview } from '../lib/admin'
import { whenLabel } from '../lib/reviews'

/**
 * The Homami team page (#/admin, from ≡ → Homami team; database script 19; Sara, Nov 14, 2026).
 * Only for the team, and read only. Not in Figma: built from Header, StatTile, Avatar, Tag and Note.
 *   Numbers · Stay in exchange for care (interest, script 18) · Members (newest first, with emails)
 */
export interface TeamPageProps {
  overview?: TeamOverview | null
  members?: TeamMember[] | null
  taps?: InterestTap[] | null
  /** Not on the team, script 19 not run, or offline */
  error?: string | null
  onOpenPerson?: (id: string) => void
  onBack: () => void
}

const date = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export function TeamPage({ overview, members, taps, error, onOpenPerson, onBack }: TeamPageProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
      <Header title="Homami team" onBack={onBack} />
      <div className="flex flex-1 flex-col gap-xl px-l pt-s pb-[40px]">
        {error ? (
          <Note title="Can’t show this page">{error}</Note>
        ) : (
          <>
            <p className="text-label-light text-dark-grey">Only you and the rest of the team can see this page. Nothing can be changed from here.</p>

            <section aria-labelledby="team-numbers" className="flex flex-col gap-m">
              <h2 id="team-numbers" className="text-overline text-dark-grey">
                Numbers
              </h2>
              {overview ? (
                <div className="grid grid-cols-2 gap-s">
                  <StatTile value={overview.members} label="Members" detail={`+${overview.members_7_days} this week · +${overview.members_30_days} this month`} className="col-span-2" />
                  <StatTile value={overview.sitters} label="Offer pet sitting" />
                  <StatTile value={overview.pets} label="Pets" />
                  <StatTile value={overview.posts} label="Posts" />
                  <StatTile value={overview.care_requests} label="Care requests" />
                  <StatTile value={overview.bookings} label="Bookings" detail={`${overview.bookings_accepted} accepted · ${overview.bookings_paid} paid`} />
                  <StatTile value={overview.reviews} label="Reviews" />
                </div>
              ) : (
                <p className="text-label text-medium-grey">Loading…</p>
              )}
            </section>

            <section aria-labelledby="team-interest" className="flex flex-col gap-m">
              <h2 id="team-interest" className="text-overline text-dark-grey">
                Stay in exchange for care
              </h2>
              {overview && (
                <>
                  <p className="text-label text-medium-grey">
                    {overview.interest_people === 0
                      ? 'Nobody has tapped it yet.'
                      : `${overview.interest_people} ${overview.interest_people === 1 ? 'person has' : 'people have'} tapped it. It says Coming soon.`}
                  </p>
                  {overview.interest.length > 0 && (
                    <div className="grid grid-cols-3 gap-s">
                      {overview.interest.map((i) => (
                        <StatTile key={i.place} value={i.taps} label={PLACE_LABELS[i.place]} detail={`${i.people} ${i.people === 1 ? 'person' : 'people'}`} />
                      ))}
                    </div>
                  )}
                </>
              )}
              {taps && taps.length > 0 && (
                <ul className="flex flex-col divide-y divide-light-grey">
                  {taps.map((t, n) => (
                    <li key={`${t.user_id}-${t.tapped_at}-${n}`} className="flex items-center justify-between gap-m py-s">
                      <div className="flex min-w-0 flex-col">
                        <p className="truncate text-label-bold text-dark-grey">{t.first_name ?? 'No name yet'}</p>
                        <p className="truncate text-caption text-medium-grey">{t.email}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end">
                        <p className="text-caption text-dark-grey">{PLACE_LABELS[t.place]}</p>
                        <p className="text-caption text-medium-grey">{whenLabel(t.tapped_at)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="team-members" className="flex flex-col gap-m">
              <h2 id="team-members" className="text-overline text-dark-grey">
                Members{members ? ` (${members.length})` : ''}
              </h2>
              {!members ? (
                <p className="text-label text-medium-grey">Loading…</p>
              ) : (
                <ul className="flex flex-col divide-y divide-light-grey">
                  {members.map((m) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={onOpenPerson && (() => onOpenPerson(m.id))}
                        className="flex w-full items-start gap-m py-m text-left outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-primary-sage"
                      >
                        <Avatar size="small" name={m.first_name ?? m.email ?? '?'} />
                        <div className="flex min-w-0 flex-1 flex-col gap-xs">
                          <p className="truncate text-label-bold text-dark-grey">{m.first_name ?? 'No name yet'}</p>
                          <p className="truncate text-caption text-dark-grey">{m.email}</p>
                          <p className="text-caption text-medium-grey">
                            {[m.city, `Joined ${date(m.joined_at)}`, m.invited_by_name && `invited by ${m.invited_by_name}`].filter(Boolean).join(' · ')}
                          </p>
                          <p className="text-caption text-medium-grey">{m.last_sign_in_at ? `Last logged in ${whenLabel(m.last_sign_in_at).toLowerCase()}` : 'Never logged in'}</p>
                          {(m.offers_care || m.pet_count > 0) && (
                            <div className="flex flex-wrap gap-xs pt-xs">
                              {m.offers_care && <Tag size="small" color="sage">Offers care</Tag>}
                              {m.pet_count > 0 && <Tag size="small">{`${m.pet_count} ${m.pet_count === 1 ? 'pet' : 'pets'}`}</Tag>}
                            </div>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}
