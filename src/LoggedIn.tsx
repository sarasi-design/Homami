import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { SetUpProfile } from './screens/SetUpProfile'
import { MyProfile } from './screens/MyProfile'
import { PetType } from './screens/PetType'
import type { PetKind } from './screens/PetType'
import { AddPet } from './screens/AddPet'
import { AppLayout } from './screens/AppLayout'
import { CircleContent, HomeContent, InviteFriends, JoinCircle, PersonPage } from './screens/CircleScreens'
import type { PetSummary } from './components/blocks/PetsSection'
import { getMyProfile, saveMyProfile } from './lib/profile'
import type { Profile } from './lib/profile'
import { addPet, formatAge, listPetsOf } from './lib/pets'
import type { Pet } from './lib/pets'
import { getInviteOwner, getMyCircle, getMyInviteCode, getPerson, inviteLinkFor, joinCircle } from './lib/circle'
import type { CircleMember, PersonProfile } from './lib/circle'
import { logOut } from './lib/auth'
import { go, goBack, useRoute } from './lib/router'

/**
 * Everything after logging in.
 *   Setup, in order: 1. Set up your profile  2. Add your first pet
 *   Then the app:   Home · Circle (bottom nav), Your profile (your photo, top left),
 *                   Invite friends, and the profiles of people in your circle.
 *   Opening someone's invite link while logged in asks "Add Sara to your circle?"
 */
type PetStep = { step: 'none' } | { step: 'type' } | { step: 'form'; kind: PetKind }

const toSummary = (pet: Pet): PetSummary => ({
  id: pet.id,
  name: pet.name,
  kindLabel: pet.kind === 'dog' ? 'Dog' : 'Cat',
  ageLabel: formatAge(pet.age),
  photoUrl: pet.photo_url,
})

function inviteFromLink() {
  return new URLSearchParams(window.location.search).get('invite')
}

function clearInviteFromLink() {
  const url = new URL(window.location.href)
  url.searchParams.delete('invite')
  window.history.replaceState(null, '', url.pathname + url.search + url.hash)
}

export function LoggedIn({ session, onLoggedOut }: { session: Session; onLoggedOut: () => void }) {
  const userId = session.user.id
  const route = useRoute()
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined) // undefined = loading
  const [pets, setPets] = useState<Pet[] | undefined>(undefined)
  const [editingProfile, setEditingProfile] = useState(false)
  const [petStep, setPetStep] = useState<PetStep>({ step: 'none' })
  const [circle, setCircle] = useState<CircleMember[] | undefined>(undefined)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [pendingInvite, setPendingInvite] = useState<{ code: string; id: string; name: string; photoUrl: string | null } | null>(null)
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  const refreshCircle = useCallback(() => {
    getMyCircle().then(setCircle).catch(() => setCircle([]))
  }, [])

  // Load what's needed once logged in
  useEffect(() => {
    let cancelled = false
    Promise.all([getMyProfile(userId).catch(() => null), listPetsOf(userId).catch(() => [])]).then(([p, list]) => {
      if (cancelled) return
      setProfile(p)
      setPets(list)
    })
    getMyInviteCode(userId).then((c) => !cancelled && setInviteCode(c)).catch(() => {})
    getMyCircle()
      .then((list) => {
        if (cancelled) return
        setCircle(list)
        // An invite link opened while logged in: ask to join, unless it's yours or you're already connected
        const code = inviteFromLink()
        if (!code) return
        getInviteOwner(code)
          .then((owner) => {
            if (cancelled) return
            if (!owner || owner.id === userId || list.some((m) => m.id === owner.id)) return clearInviteFromLink()
            setPendingInvite({ code, id: owner.id, name: owner.first_name ?? 'your friend', photoUrl: owner.avatar_url })
          })
          .catch(clearInviteFromLink)
      })
      .catch(() => !cancelled && setCircle([]))
    return () => {
      cancelled = true
    }
  }, [userId])

  if (profile === undefined || pets === undefined) return null // loading

  // ---- Setup 1: profile (first time) or Edit profile -------------------------------------------
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

  // ---- Setup 2: pets (first pet, or "Add a pet" from your profile) -----------------------------
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

  // ---- Someone's invite link -------------------------------------------------------------------
  if (pendingInvite) {
    return (
      <JoinCircle
        inviter={{ name: pendingInvite.name, photoUrl: pendingInvite.photoUrl }}
        busy={joining}
        error={joinError}
        onAccept={async () => {
          setJoining(true)
          setJoinError(null)
          try {
            await joinCircle(pendingInvite.code)
            clearInviteFromLink()
            setPendingInvite(null)
            refreshCircle()
            go(`/people/${pendingInvite.id}`)
          } catch (err) {
            setJoinError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
          } finally {
            setJoining(false)
          }
        }}
        onDecline={() => {
          clearInviteFromLink()
          setPendingInvite(null)
        }}
      />
    )
  }

  const me = { name: profile.first_name, photoUrl: profile.avatar_url }
  const inviteLink = inviteCode ? inviteLinkFor(inviteCode) : null

  // ---- Pages -----------------------------------------------------------------------------------
  if (route === '/profile') {
    return (
      <MyProfile
        name={profile.first_name}
        photoUrl={profile.avatar_url}
        city={profile.city}
        bio={profile.bio}
        pets={pets.map(toSummary)}
        onBack={goBack}
        onEditProfile={() => setEditingProfile(true)}
        onAddPet={() => setPetStep({ step: 'type' })}
        onLogOut={() => logOut().then(() => {
          go('/')
          onLoggedOut()
        })}
      />
    )
  }

  if (route === '/invite') {
    return <InviteFriends link={inviteLink} onBack={goBack} />
  }

  const personMatch = route.match(/^\/people\/([0-9a-f-]+)$/)
  if (personMatch) {
    return <PersonRoute id={personMatch[1]} />
  }

  const tab = route === '/circle' ? 'circle' : 'home'
  return (
    <AppLayout me={me} tab={tab} onTab={(t) => go(t === 'home' ? '/' : `/${t}`)} onOpenProfile={() => go('/profile')}>
      {tab === 'circle' ? (
        <CircleContent
          members={circle?.map((m) => ({
            id: m.id,
            name: m.first_name ?? 'New member',
            city: m.city,
            photoUrl: m.avatar_url,
            sharedCount: m.shared_count,
          }))}
          onInvite={() => go('/invite')}
          onOpenPerson={(id) => go(`/people/${id}`)}
        />
      ) : (
        <HomeContent onInvite={() => go('/invite')} />
      )}
    </AppLayout>
  )
}

/** Loads one person in your circle and their pets */
function PersonRoute({ id }: { id: string }) {
  const [person, setPerson] = useState<PersonProfile | null | undefined>(undefined)
  const [pets, setPets] = useState<Pet[] | undefined>(undefined)
  useEffect(() => {
    let cancelled = false
    getPerson(id).then((p) => !cancelled && setPerson(p)).catch(() => !cancelled && setPerson(null))
    listPetsOf(id).then((list) => !cancelled && setPets(list)).catch(() => !cancelled && setPets([]))
    return () => {
      cancelled = true
    }
  }, [id])
  return (
    <PersonPage
      person={person && { name: person.first_name ?? 'New member', photoUrl: person.avatar_url, city: person.city, bio: person.bio }}
      pets={pets?.map(toSummary)}
      onBack={goBack}
    />
  )
}
