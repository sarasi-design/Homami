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
import { addPet, formatAge, listPetsOf, removePet, updatePet } from './lib/pets'
import type { Pet } from './lib/pets'
import { getInviteOwner, getMyCircle, getMyInviteCode, getPerson, inviteLinkFor, joinCircle } from './lib/circle'
import type { CircleMember, PersonProfile } from './lib/circle'
import { logOut } from './lib/auth'
import { createPost, deletePost, listFeed, timeAgo } from './lib/posts'
import type { Post } from './lib/posts'
import { NewPost } from './screens/NewPost'
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

/** "Skip for now" on the first-pet step (or removing your last pet) is remembered on this phone. */
const skipKey = (userId: string) => `homami:no-pet-yet:${userId}`
function rememberedSkip(userId: string) {
  try {
    return localStorage.getItem(skipKey(userId)) === '1'
  } catch {
    return false
  }
}
function rememberSkip(userId: string) {
  try {
    localStorage.setItem(skipKey(userId), '1')
  } catch {
    /* private mode: it just asks again next time */
  }
}

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
  const [feed, setFeed] = useState<Post[] | undefined>(undefined)
  const [skippedPet, setSkippedPet] = useState(() => rememberedSkip(userId))

  const refreshCircle = useCallback(() => {
    getMyCircle().then(setCircle).catch(() => setCircle([]))
  }, [])

  // The wall: load it whenever Home is opened, so new posts from your circle show up
  useEffect(() => {
    if (route !== '/') return
    let cancelled = false
    listFeed().then((list) => !cancelled && setFeed(list)).catch(() => !cancelled && setFeed((f) => f ?? []))
    return () => {
      cancelled = true
    }
  }, [route])

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
  const needsFirstPet = pets.length === 0 && !skippedPet
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
        onSkip={
          needsFirstPet
            ? () => {
                rememberSkip(userId)
                setSkippedPet(true)
              }
            : undefined
        }
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
        onOpenPet={(id) => go(`/pets/${id}`)}
        onLogOut={() => logOut().then(() => {
          go('/')
          onLoggedOut()
        })}
      />
    )
  }

  if (route === '/new-post') {
    return (
      <NewPost
        pets={pets.map((p) => ({ id: p.id, name: p.name, photoUrl: p.photo_url }))}
        onBack={goBack}
        onSubmit={async (values) => {
          const post = await createPost(userId, values)
          setFeed((list) => [post, ...(list ?? [])])
          go('/')
        }}
      />
    )
  }

  const petMatch = route.match(/^\/pets\/([0-9a-f-]+)$/)
  const editingPet = petMatch && pets.find((p) => p.id === petMatch[1])
  if (editingPet) {
    return (
      <AddPet
        key={editingPet.id}
        title="Edit pet"
        kind={editingPet.kind}
        initial={{ name: editingPet.name, age: editingPet.age, description: editingPet.description, photoUrl: editingPet.photo_url }}
        onBack={goBack}
        onSubmit={async (values) => {
          const saved = await updatePet(userId, editingPet.id, values)
          setPets((list) => list?.map((p) => (p.id === saved.id ? saved : p)))
          goBack()
        }}
        onRemove={async () => {
          await removePet(editingPet.id)
          // Removing your last pet doesn't send you back to the first-pet step
          if (pets.length === 1) {
            rememberSkip(userId)
            setSkippedPet(true)
          }
          setPets((list) => list?.filter((p) => p.id !== editingPet.id))
          goBack()
        }}
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
        <HomeContent
          me={me}
          hasCircle={(circle?.length ?? 0) > 0}
          posts={feed?.map((post) => ({
            id: post.id,
            authorName: post.author?.first_name ?? 'Someone',
            authorPhotoUrl: post.author?.avatar_url,
            city: post.author?.city,
            petName: post.pet?.name,
            body: post.body,
            photoUrl: post.photo_url,
            when: timeAgo(post.created_at),
            onDelete:
              post.author_id === userId
                ? async () => {
                    await deletePost(post.id)
                    setFeed((list) => list?.filter((p) => p.id !== post.id))
                  }
                : undefined,
          }))}
          onNewPost={() => go('/new-post')}
          onInvite={() => go('/invite')}
        />
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
