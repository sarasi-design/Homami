import { LogOut, Pencil } from 'lucide-react'
import { Button } from '../components/basics/Button'
import { Header } from '../components/blocks/Header'
import { ProfileHero } from '../components/blocks/ProfileHero'
import { PetsSection } from '../components/blocks/PetsSection'
import type { PetSummary } from '../components/blocks/PetsSection'

/**
 * Your profile — Figma ONBOARDING owner profile (85:10926), v1 version:
 * hero (photo, name, city, bio, Edit profile) and Your pets with an add tile.
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
}

export function MyProfile({ name, photoUrl, city, bio, pets, onEditProfile, onAddPet, onOpenPet, onLogOut, onBack }: MyProfileProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
      <Header title="Your profile" onBack={onBack} />
      <div className="flex flex-1 flex-col gap-xl px-l pb-[40px]">
        <ProfileHero
          name={name}
          photoUrl={photoUrl}
          city={city}
          bio={bio}
          bioPlaceholder="Introduce yourself with a short bio"
          actions={
            <Button variant="outline" size="small" iconLeft={Pencil} onClick={onEditProfile}>
              Edit profile
            </Button>
          }
        />

        <section className="flex flex-col gap-m">
          <div className="flex items-baseline justify-between gap-s">
            <h2 className="text-body text-dark-grey">Your pets</h2>
            {onOpenPet && pets.length > 0 && <p className="text-caption text-medium-grey">Tap a pet to edit</p>}
          </div>
          <PetsSection pets={pets} onAdd={onAddPet} onOpen={onOpenPet} />
        </section>

        <div className="mt-auto flex justify-center pt-xl">
          <Button variant="ghost" size="small" iconLeft={LogOut} onClick={onLogOut}>
            Log out
          </Button>
        </div>
      </div>
    </main>
  )
}
