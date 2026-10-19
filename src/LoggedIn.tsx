import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { SetUpProfile } from './screens/SetUpProfile'
import { MyProfile } from './screens/MyProfile'
import { PetType } from './screens/PetType'
import type { PetKind } from './screens/PetType'
import { AddPet } from './screens/AddPet'
import { AppLayout } from './screens/AppLayout'
import { CircleContent, CirclePage, ExtendedCircleContent, HomeContent, InviteFriends, JoinCircle, PersonPage } from './screens/CircleScreens'
import type { WallFilter, WallItem } from './screens/CircleScreens'
import { HowWillYouUse } from './screens/HowWillYouUse'
import { SitterSetup } from './screens/SitterSetup'
import type { PetSummary } from './components/blocks/PetsSection'
import { getMyProfile, saveMyProfile, saveWants } from './lib/profile'
import type { Profile } from './lib/profile'
import { addPet, formatAge, listPetsOf, removePet, updatePet } from './lib/pets'
import type { Pet } from './lib/pets'
import { getExtendedCircle, getInviteOwner, getMyCircle, getMyInviteCode, getPerson, inviteLinkFor, joinCircle } from './lib/circle'
import type { CircleMember, PersonProfile } from './lib/circle'
import { logOut } from './lib/auth'
import { createPost, deletePost, listFeed, timeAgo } from './lib/posts'
import type { Post } from './lib/posts'
import { NewPost } from './screens/NewPost'
import { go, goBack, useRoute } from './lib/router'
import { availabilityLabel, getSitterProfile, listSitters, priceSummary, removeSitterProfile, saveSitterProfile } from './lib/sitters'
import type { SitterListing, SitterProfile } from './lib/sitters'

/**
 * Everything after logging in.
 *   Setup, in order: 1. Set up your profile  2. How will you use Homami?
 *                    3. Add your first pet (unless you only offer care)  4. Pet sitter profile (if you offer care)
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

/**
 * "Skip for now" on the first-pet step (or removing your last pet), and "Not now" on the
 * pet sitter step, are remembered on this phone so we don't keep asking.
 */
type SkipWhat = 'pet' | 'sitter'
const skipKey = (what: SkipWhat, userId: string) => (what === 'pet' ? `homami:no-pet-yet:${userId}` : `homami:no-sitter-yet:${userId}`)
function rememberedSkip(what: SkipWhat, userId: string) {
  try {
    return localStorage.getItem(skipKey(what, userId)) === '1'
  } catch {
    return false
  }
}
function rememberSkip(what: SkipWhat, userId: string) {
  try {
    localStorage.setItem(skipKey(what, userId), '1')
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
  const [skippedPet, setSkippedPet] = useState(() => rememberedSkip('pet', userId))
  const [skippedSitter, setSkippedSitter] = useState(() => rememberedSkip('sitter', userId))
  const [sitter, setSitter] = useState<SitterProfile | null | undefined>(undefined)
  const [sitters, setSitters] = useState<SitterListing[] | undefined>(undefined)
  const [extended, setExtended] = useState<CircleMember[] | undefined>(undefined)
  const [wallFilter, setWallFilter] = useState<WallFilter>('all')

  const refreshCircle = useCallback(() => {
    getMyCircle().then(setCircle).catch(() => setCircle([]))
  }, [])

  // The wall: load posts and pet sitters whenever Home is opened, so new ones show up
  useEffect(() => {
    if (route !== '/') return
    let cancelled = false
    listFeed().then((list) => !cancelled && setFeed(list)).catch(() => !cancelled && setFeed((f) => f ?? []))
    listSitters(userId).then((list) => !cancelled && setSitters(list)).catch(() => !cancelled && setSitters((l) => l ?? []))
    return () => {
      cancelled = true
    }
  }, [route, userId])

  // Extended circle: needed on the wall (to place sitters) and on Circle › Extended circle
  useEffect(() => {
    if (route !== '/circle/extended' && route !== '/') return
    let cancelled = false
    getExtendedCircle().then((list) => !cancelled && setExtended(list)).catch(() => !cancelled && setExtended((l) => l ?? []))
    return () => {
      cancelled = true
    }
  }, [route])

  // Load what's needed once logged in
  useEffect(() => {
    let cancelled = false
    Promise.all([getMyProfile(userId).catch(() => null), listPetsOf(userId).catch(() => []), getSitterProfile(userId).catch(() => null)]).then(
      ([p, list, s]) => {
        if (cancelled) return
        setProfile(p)
        setPets(list)
        setSitter(s)
      },
    )
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

  if (profile === undefined || pets === undefined || sitter === undefined) return null // loading

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

  // ---- Setup 2: How will you use Homami? (new people only) -------------------------------------
  const wants = profile.wants
  if (!wants && pets.length === 0 && !sitter && !skippedPet) {
    return (
      <HowWillYouUse
        onSubmit={async (w) => {
          await saveWants(userId, w)
          setProfile((p) => (p ? { ...p, wants: w } : p))
        }}
      />
    )
  }

  // ---- Setup 3: pets (first pet, or "Add a pet" from your profile) -----------------------------
  const needsFirstPet = wants !== 'offer' && pets.length === 0 && !skippedPet
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
                rememberSkip('pet', userId)
                setSkippedPet(true)
              }
            : undefined
        }
      />
    )
  }

  // ---- Setup 4: pet sitter profile (if you offer care), or Add services / Edit from your profile --
  const needsSitterSetup = (wants === 'offer' || wants === 'both') && !sitter && !skippedSitter
  if (needsSitterSetup || route === '/sitter') {
    const fromProfile = route === '/sitter'
    return (
      <SitterSetup
        key={sitter ? 'edit' : 'setup'}
        mode={sitter ? 'edit' : 'setup'}
        initial={sitter ?? undefined}
        onBack={fromProfile ? goBack : undefined}
        onSkip={() => {
          rememberSkip('sitter', userId)
          setSkippedSitter(true)
          if (fromProfile) goBack()
        }}
        onSubmit={async (values) => {
          setSitter(await saveSitterProfile(userId, values))
          setSitters(undefined)
          if (fromProfile) goBack()
        }}
        onRemove={async () => {
          await removeSitterProfile(userId)
          rememberSkip('sitter', userId)
          setSkippedSitter(true)
          setSitter(null)
          setSitters(undefined)
          goBack()
        }}
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
        sitter={sitter}
        onSitter={() => go('/sitter')}
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
            rememberSkip('pet', userId)
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
    const id = personMatch[1]
    return <PersonRoute id={id} inCircle={circle ? circle.some((m) => m.id === id) : true} />
  }

  const tab = route === '/circle' || route === '/circle/extended' ? 'circle' : 'home'
  const goCircleView = (v: 'circle' | 'extended') => go(v === 'circle' ? '/circle' : '/circle/extended')
  const circleIds = new Set(circle?.map((m) => m.id))
  const myCity = profile.city?.trim().toLowerCase()
  // ---- The wall: your circle's posts, with pet sitters in between --------------------------------
  // Sitters are ranked: your circle, your extended circle, your city, then everyone else.
  // With no circle yet, the wall is all sitters.
  const extendedIds = new Set(extended?.map((m) => m.id))
  const relationOf = (s: SitterListing) => {
    if (circleIds.has(s.user_id)) return { rank: 0, label: 'In your circle', group: 'circle' }
    if (extendedIds.has(s.user_id)) return { rank: 1, label: 'In your extended circle', group: 'extended' }
    const city = s.profile?.city?.trim()
    if (city && city.toLowerCase() === myCity) return { rank: 2, label: `Near you · ${city}`, group: 'other' }
    return { rank: 3, label: city ?? 'On Homami', group: 'other' }
  }
  const sitterItems: (WallItem & { group: string })[] =
    sitters
      ?.map((s) => ({ s, rel: relationOf(s) }))
      .sort((a, b) => a.rel.rank - b.rel.rank)
      .map(({ s, rel }) => ({
        kind: 'sitter' as const,
        id: s.user_id,
        group: rel.group,
        name: s.profile?.first_name ?? 'Pet sitter',
        photoUrl: s.profile?.avatar_url,
        relation: rel.label,
        availability: availabilityLabel(s.available_from),
        offers: s.offers,
        price: priceSummary(s),
      })) ?? []
  const postItems: WallItem[] =
    feed?.map((post) => ({
      kind: 'post' as const,
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
    })) ?? []
  /** A sitter card after every 3 posts; any sitters left over go at the end */
  const mix = (posts: WallItem[], sitterCards: WallItem[]) => {
    const out: WallItem[] = []
    let k = 0
    posts.forEach((p, i) => {
      out.push(p)
      if ((i + 1) % 3 === 0 && k < sitterCards.length) out.push(sitterCards[k++])
    })
    return [...out, ...sitterCards.slice(k)]
  }
  const wallItems: WallItem[] | undefined =
    feed === undefined || sitters === undefined
      ? undefined
      : wallFilter === 'sitters'
        ? sitterItems
        : wallFilter === 'extended'
          ? sitterItems.filter((s) => s.group === 'extended')
          : wallFilter === 'circle'
            ? mix(postItems, sitterItems.filter((s) => s.group === 'circle'))
            : mix(postItems, sitterItems)

  return (
    <AppLayout me={me} tab={tab} header={tab !== 'home'} onTab={(t) => go(t === 'home' ? '/' : `/${t}`)} onOpenProfile={() => go('/profile')}>
      {route === '/circle/extended' ? (
        <CirclePage view="extended" onView={goCircleView} showInvite={(circle?.length ?? 0) > 0} onInvite={() => go('/invite')}>
          <ExtendedCircleContent
            hasCircle={(circle?.length ?? 0) > 0}
            people={extended?.map((m) => ({ id: m.id, name: m.first_name ?? 'New member', city: m.city, photoUrl: m.avatar_url, sharedCount: m.shared_count }))}
            onOpenPerson={(id) => go(`/people/${id}`)}
          />
        </CirclePage>
      ) : tab === 'circle' ? (
        <CirclePage view="circle" onView={goCircleView} showInvite={(circle?.length ?? 0) > 0} onInvite={() => go('/invite')}>
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
        </CirclePage>
      ) : (
        <HomeContent
          me={me}
          hasCircle={(circle?.length ?? 0) > 0}
          items={wallItems}
          filter={wallFilter}
          onFilter={setWallFilter}
          iAmSitter={!!sitter}
          onNewPost={() => go('/new-post')}
          onOpenProfile={() => go('/profile')}
          onInvite={() => go('/invite')}
          onOpenSitter={(id) => go(`/people/${id}`)}
          onBecomeSitter={() => go('/sitter')}
        />
      )}
    </AppLayout>
  )
}

/** Loads one person (in your circle, or a pet sitter), their pets and their pet sitting */
function PersonRoute({ id, inCircle }: { id: string; inCircle: boolean }) {
  const [person, setPerson] = useState<PersonProfile | null | undefined>(undefined)
  const [pets, setPets] = useState<Pet[] | undefined>(undefined)
  const [sitter, setSitter] = useState<SitterProfile | null>(null)
  useEffect(() => {
    let cancelled = false
    getPerson(id).then((p) => !cancelled && setPerson(p)).catch(() => !cancelled && setPerson(null))
    listPetsOf(id).then((list) => !cancelled && setPets(list)).catch(() => !cancelled && setPets([]))
    getSitterProfile(id).then((s) => !cancelled && setSitter(s)).catch(() => {})
    return () => {
      cancelled = true
    }
  }, [id])
  return (
    <PersonPage
      person={person && { name: person.first_name ?? 'New member', photoUrl: person.avatar_url, city: person.city, bio: person.bio }}
      pets={inCircle ? pets?.map(toSummary) : null}
      sitter={sitter}
      onBack={goBack}
    />
  )
}
