import { Pencil, Plus } from 'lucide-react'
import { AppMenu } from '../components/blocks/AppMenu'
import { Tag } from '../components/basics/Tag'
import { Banner } from '../components/blocks/Banner'
import { OffersSection } from '../components/blocks/OffersSection'
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
 * Pet sitting: your Offers section with Edit (Figma 127:9167), or a banner to start offering it (85:10987).
 * Left out for later: counters, Endorse/Share, Shared circle, Add to Circle/Chat, pet care requests.
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
  onBack?: () => void
  /** Your pet sitter profile, if you offer pet sitting */
  sitter?: SitterProfile | null
  /** "Add services" (not a sitter yet) or "Edit" on the Offers section */
  onSitter?: () => void
}

export function MyProfile({ name, photoUrl, city, bio, pets, onEditProfile, onAddPet, onOpenPet, onLogOut, onBack, sitter, onSitter }: MyProfileProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
      <Header
        title="Your profile"
        onBack={onBack}
        actions={onLogOut && <AppMenu onLogOut={onLogOut} />}
      />
      <div className="flex flex-1 flex-col gap-xl px-l pb-[40px]">
        <ProfileHero
          name={name}
          photoUrl={photoUrl}
          city={city}
          bio={bio}
          bioPlaceholder="Introduce yourself with a short bio"
          status={sitter ? <Tag color="sage" size="small">{availabilityLabel(sitter.available_from)}</Tag> : undefined}
          editAction={<IconButton icon={Pencil} label="Edit profile" size="small" onClick={onEditProfile} />}
        />

        <section className="flex flex-col gap-m">
          <div className="flex min-h-[36px] items-center justify-between gap-s">
            <h2 className="text-body text-dark-grey">Your pets</h2>
            {onAddPet && pets.length > 0 && <IconButton icon={Plus} label="Add a pet" size="small" onClick={onAddPet} />}
          </div>
          <PetsSection pets={pets} onAdd={onAddPet} onOpen={onOpenPet} />
        </section>

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
