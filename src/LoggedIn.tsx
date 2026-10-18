import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { SetUpProfile } from './screens/SetUpProfile'
import { MyProfile } from './screens/MyProfile'
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
 *   3. Your profile — the home screen for now (circle and wall come next)
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

  // 1. Profile (first time) or Edit profile (from Your profile)
  if (!profile?.first_name || editingProfile) {
    return (
      <SetUpProfile
        mode={profile?.first_name ? 'edit' : 'setup'}
        onCancel={() => setEditingProfile(false)}
        initial={{ firstName: profile?.first_name, city: profile?.city, avatarUrl: profile?.avatar_url, bio: profile?.bio }}
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
        title={needsFirstPet ? 'Set up profile' : 'Add a pet'}
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
        title={needsFirstPet ? 'Set up profile' : 'Add a pet'}
        onChoose={(kind) => setPetStep({ step: 'form', kind })}
        onBack={needsFirstPet ? undefined : () => setPetStep({ step: 'none' })}
      />
    )
  }

  // 3. Your profile
  return (
    <MyProfile
      name={profile.first_name}
      photoUrl={profile.avatar_url}
      city={profile.city}
      bio={profile.bio}
      pets={pets.map((pet) => ({
        id: pet.id,
        name: pet.name,
        kindLabel: pet.kind === 'dog' ? 'Dog' : 'Cat',
        ageLabel: formatAge(pet.age),
        photoUrl: pet.photo_url,
      }))}
      onEditProfile={() => setEditingProfile(true)}
      onAddPet={() => setPetStep({ step: 'type' })}
      onLogOut={() => logOut().then(onLoggedOut)}
    />
  )
}
