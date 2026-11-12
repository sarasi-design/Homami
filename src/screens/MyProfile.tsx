import { CalendarCheck, CreditCard, Pencil, Plus } from 'lucide-react'
import { DetailRow } from '../components/basics/DetailRow'
import { CountBadge } from '../components/basics/CountBadge'
import { AppMenu } from '../components/blocks/AppMenu'
import { Tag } from '../components/basics/Tag'
import { Banner } from '../components/blocks/Banner'
import { OffersSection } from '../components/blocks/OffersSection'
import { RequestCard } from '../components/blocks/RequestCard'
import { InviteCodes } from '../components/blocks/InviteCodes'
import type { InviteCodesProps } from '../components/blocks/InviteCodes'
import type { CareRequest } from '../lib/requests'
import { availabilityLabel } from '../lib/sitters'
import type { SitterProfile } from '../lib/sitters'
import { Button, IconButton } from '../components/basics/Button'
import { Header } from '../components/blocks/Header'
import { ProfileHero } from '../components/blocks/ProfileHero'
import { PetsSection } from '../components/blocks/PetsSection'
import type { PetSummary } from '../components/blocks/PetsSection'

/**
 * Your profile — Figma ONBOARDING owner profile (85:10926), v1 version:
 * hero (photo, name, city, bio) and Your pets: compact, tap a pet to edit it, + to add one.
 * Log out lives behind the ≡ menu in the header (an ActionSheet), not on the page.
 * Icon-only ghost buttons (Sara, Oct 29): a pencil top-right of your profile (Edit profile) and on your Offers;
 * a + next to Your pets.
 * Your bookings and Payment details: two rows under your hero. Bookings waiting for your answer get a CountBadge
 * and "1 waiting for your answer" (Sara, Nov 11: requests were hard to find); your photo in the header gets the badge too.
 * Pet sitting: your Offers section with Edit (Figma 127:9167), or a banner to start offering it (85:10987).
 * Pet care requests (Figma 85:10926 "Your pet care requests"): your open requests, each with a pencil to
 * edit it, and the "Need help with your pets?" banner to make one. Shown when you said you need care
 * (or both) or have pets, so people who only offer care don't see it.
 * Invite friends (Sara, Nov 11): make a one-time invite code and copy just the code (database script 12).
 * Left out for later: counters, Endorse/Share, Shared circle, Add to Circle/Chat.
 */
export interface MyProfileProps {
  name: string
  photoUrl?: string | null
  city?: string | null
  bio?: string | null
  pets: PetSummary[]
  onEditProfile?: () => void
  onAddPet?: () => void
  /** Tapping a pet opens Edit pet */
  onOpenPet?: (id: string) => void
  onLogOut?: () => void
  /** Find out more, in the ≡ menu */
  onHelp?: () => void
  onBack?: () => void
  /** Your pet sitter profile, if you offer pet sitting */
  sitter?: SitterProfile | null
  /** "Add services" (not a sitter yet) or "Edit" on the Offers section */
  onSitter?: () => void
  /** Your open pet care requests; pass with onNewRequest to show the section */
  requests?: CareRequest[]
  onNewRequest?: () => void
  onOpenRequest?: (id: string) => void
  /** Your bookings and Payment details (database script 11) */
  onBookings?: () => void
  /** e.g. 1 booking waiting for your answer */
  bookingsWaiting?: number
  onPayments?: () => void
  /** Invite friends: your one-time invite codes (database script 12) */
  invite?: InviteCodesProps
}

export function MyProfile({ name, photoUrl, city, bio, pets, onEditProfile, onAddPet, onOpenPet, onLogOut, onHelp, onBack, sitter, onSitter, requests, onNewRequest, onOpenRequest, onBookings, bookingsWaiting = 0, onPayments, invite }: MyProfileProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
      <Header
        title="Your profile"
        onBack={onBack}
        actions={onLogOut && <AppMenu onLogOut={onLogOut} onHelp={onHelp} />}
      />
      <div className="flex flex-1 flex-col gap-xl px-l pb-[40px]">
        <ProfileHero
          name={name}
          photoUrl={photoUrl}
          city={city}
          bio={bio}
          bioPlaceholder="Introduce yourself with a short bio"
          status={sitter ? <Tag color="sage" size="small">{availabilityLabel(sitter.available_from, sitter.available_until)}</Tag> : undefined}
          editAction={<IconButton icon={Pencil} label="Edit profile" size="small" onClick={onEditProfile} />}
        />

        {(onBookings || onPayments) && (
          <section className="flex flex-col gap-xs" aria-label="Bookings and payments">
            {onBookings && (
              <DetailRow icon={CalendarCheck} size="medium" onClick={onBookings}>
                <span className="inline-flex flex-wrap items-center gap-x-s">
                  <strong>Your bookings</strong>
                  {bookingsWaiting > 0 && (
                    <>
                      <CountBadge count={bookingsWaiting} />
                      <span className="text-dark-sage">{bookingsWaiting === 1 ? '1 waiting for your answer' : `${bookingsWaiting} waiting for your answer`}</span>
                    </>
                  )}
                </span>
              </DetailRow>
            )}
            {onPayments && (
              <DetailRow icon={CreditCard} size="medium" onClick={onPayments}>
                <strong>Payment details</strong>
              </DetailRow>
            )}
          </section>
        )}

        <section className="flex flex-col gap-m">
          <div className="flex min-h-[36px] items-center justify-between gap-s">
            <h2 className="text-body text-dark-grey">Your pets</h2>
            {onAddPet && pets.length > 0 && <IconButton icon={Plus} label="Add a pet" size="small" onClick={onAddPet} />}
          </div>
          <PetsSection pets={pets} onAdd={onAddPet} onOpen={onOpenPet} />
        </section>

        {invite && <InviteCodes {...invite} />}

        {onNewRequest && (
          <section className="flex flex-col gap-m">
            <div className="flex min-h-[36px] items-center justify-between gap-s">
              <h2 className="text-body text-dark-grey">Your pet care requests</h2>
              {requests && requests.length > 0 && <IconButton icon={Plus} label="Create a request" size="small" onClick={onNewRequest} />}
            </div>
            {requests && requests.length > 0 ? (
              requests.map((r) => (
                <RequestCard
                  key={r.id}
                  title="You need"
                  needs={r.needs}
                  startDate={r.start_date}
                  endDate={r.end_date}
                  area={r.area}
                  pets={pets.filter((p) => r.pet_ids.includes(p.id))}
                  petCount={r.pet_count}
                  action={onOpenRequest && <IconButton icon={Pencil} label="Edit this request" size="small" onClick={() => onOpenRequest(r.id)} />}
                />
              ))
            ) : (
              <Banner
                title="Need help with your pets?"
                action={
                  <Button variant="dark" size="small" className="self-start" onClick={onNewRequest}>
                    Create a request
                  </Button>
                }
              />
            )}
          </section>
        )}

        {onSitter && (
          <section className="flex flex-col gap-m">
            <h2 className="text-body text-dark-grey">Pet sitting</h2>
            {sitter ? (
              <OffersSection
                sitter={sitter}
                action={
                  <IconButton icon={Pencil} label="Edit your pet sitting" size="small" onClick={onSitter} />
                }
              />
            ) : (
              <Banner
                tone="bubble"
                title="Happy to look after other people’s pets?"
                action={
                  <Button variant="dark" size="small" className="self-start" onClick={onSitter}>
                    Add services
                  </Button>
                }
              />
            )}
          </section>
        )}
      </div>
    </main>
  )
}
