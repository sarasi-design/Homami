import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Plus } from 'lucide-react'
import { Avatar } from './components/basics/Avatar'
import { Button } from './components/basics/Button'
import { SetUpProfile } from './screens/SetUpProfile'
import { PetType } from './screens/PetType'
import type { PetKind } from './screens/PetType'
import { AddPet } from './screens/AddPet'
import { getMyProfile, saveMyProfile } from './lib/profile'
import type { Profile } from './lib/profile'
import { addPet, formatAge, listMyPets } from './lib/pets'
import type { Pet } from './lib/pets'
import { logOut } from './lib/auth'

/**
 * Everything after logging in. New people go through the setup steps in order:
 *   1. Set up your profile (until there's a first name)
 *   2. Tell us about your pet → Add your pet (until there's at least one pet)
 *   3. Home — a temporary stand-in until the real profile page is built
 */
type PetStep = { step: 'none' } | { step: 'type' } | { step: 'form'; kind: PetKind }

export function LoggedIn({ session, onLoggedOut }: { session: Session; onLoggedOut: () => void }) {
  const userId = session.user.id
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined) // undefined = loading
  const [pets, setPets] = useState<Pet[] | undefined>(undefined)
  const [editingProfile, setEditingProfile] = useState(false)
  const [petStep, setPetStep] = useState<PetStep>({ step: 'none' })

  useEffect(() => {
    let cancelled = false
    Promise.all([getMyProfile(userId).catch(() => null), listMyPets().catch(() => [])]).then(([p, list]) => {
      if (cancelled) return
      setProfile(p)
      setPets(list)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  if (profile === undefined || pets === undefined) return null // loading

  // 1. Profile
  if (!profile?.first_name || editingProfile) {
    return (
      <SetUpProfile
        initial={{ firstName: profile?.first_name, city: profile?.city, avatarUrl: profile?.avatar_url }}
        onSubmit={async (values) => {
          setProfile(await saveMyProfile(userId, values))
          setEditingProfile(false)
        }}
      />
    )
  }

  // 2. Pet — required the first time, and again whenever "Add another pet" is tapped
  const needsFirstPet = pets.length === 0
  if (petStep.step === 'form') {
    return (
      <AddPet
        kind={petStep.kind}
        onBack={() => setPetStep({ step: 'type' })}
        onSubmit={async (values) => {
          const pet = await addPet(userId, values)
          setPets((list) => [...(list ?? []), pet])
          setPetStep({ step: 'none' })
        }}
      />
    )
  }
  if (needsFirstPet || petStep.step === 'type') {
    return (
      <PetType
        onChoose={(kind) => setPetStep({ step: 'form', kind })}
        onBack={needsFirstPet ? undefined : () => setPetStep({ step: 'none' })}
      />
    )
  }

  // 3. Temporary home, until the real profile page (Figma "USER PROFILE") is built
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-2xl bg-surface px-l pt-[min(104px,12dvh)] pb-[40px]">
      <div className="flex flex-col items-center gap-l text-center">
        <Avatar size="xlarge" name={profile.first_name} src={profile.avatar_url ?? undefined} />
        <h1 className="text-title-large text-dark-sage">Hi {profile.first_name}!</h1>
        <p className="text-body text-medium-grey">You’re all set up. Your real profile page comes next.</p>
      </div>

      <section className="flex flex-col gap-m">
        <h2 className="text-overline text-dark-grey">Your pets</h2>
        <ul className="flex flex-col gap-m">
          {pets.map((pet) => (
            <li key={pet.id} className="flex items-center gap-l rounded-card border border-soft-grey p-l">
              <Avatar size="large" name={pet.name} src={pet.photo_url ?? undefined} />
              <div className="flex flex-col">
                <span className="text-caption text-medium-grey">{pet.kind === 'dog' ? 'Dog' : 'Cat'}</span>
                <span className="text-body-bold text-dark-grey">{pet.name}</span>
                {formatAge(pet.age) && <span className="text-label text-medium-grey">{formatAge(pet.age)}</span>}
              </div>
            </li>
          ))}
        </ul>
        <Button variant="outline" size="small" iconLeft={Plus} onClick={() => setPetStep({ step: 'type' })} className="self-start">
          Add another pet
        </Button>
      </section>

      <div className="mt-auto flex justify-center gap-m">
        <Button variant="ghost" size="small" onClick={() => setEditingProfile(true)}>
          Edit profile
        </Button>
        <Button variant="ghost" size="small" onClick={() => logOut().then(onLoggedOut)}>
          Log out
        </Button>
      </div>
    </main>
  )
}
