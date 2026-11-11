import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { SetUpProfile } from './screens/SetUpProfile'
import { MyProfile } from './screens/MyProfile'
import { PetType } from './screens/PetType'
import type { PetKind } from './screens/PetType'
import { AddPet } from './screens/AddPet'
import { AppLayout, WithBottomNav } from './screens/AppLayout'
import { ChatThread, ChatsContent } from './screens/Chat'
import type { ThreadMessage } from './screens/Chat'
import { getMessages, listChats, markChatRead, onNewMessage, sendMessage } from './lib/chat'
import type { ChatSummary } from './lib/chat'
import { CircleContent, CirclePage, ExtendedCircleContent, HomeContent, InviteFriends, JoinCircle, PersonPage } from './screens/CircleScreens'
import type { WallFilter, WallItem } from './screens/CircleScreens'
import { HowWillYouUse } from './screens/HowWillYouUse'
import { SitterSetup } from './screens/SitterSetup'
import { CareRequest } from './screens/CareRequest'
import { BookSitter } from './screens/BookSitter'
import { Bookings } from './screens/Bookings'
import { PaymentDetails } from './screens/PaymentDetails'
import { acceptBooking, cancelBooking, declineBooking, listMyBookings, requestBooking } from './lib/bookings'
import type { BookingListing } from './lib/bookings'
import { callPayments, canBePaid, cardLabel, getPaymentProfile } from './lib/payments'
import type { PaymentProfile } from './lib/payments'
import { paymentsConfigured } from './lib/stripe'
import { createRequest, listOpenRequests, listRequestsOf, removeRequest, updateRequest } from './lib/requests'
import type { CareRequest as CareRequestRow, RequestListing } from './lib/requests'
import type { PetSummary } from './components/blocks/PetsSection'
import { getMyProfile, saveMyProfile, saveWants } from './lib/profile'
import type { Profile } from './lib/profile'
import { addPet, formatAge, listPetsOf, removePet, updatePet } from './lib/pets'
import type { Pet } from './lib/pets'
import { createInviteCode, getExtendedCircle, getInviteOwner, getMyCircle, getMyInviteCode, getPerson, inviteLinkFor, joinCircle, listMyInviteCodes, removeInviteCode } from './lib/circle'
import type { CircleMember, InviteCode, PersonProfile } from './lib/circle'
import { logOut } from './lib/auth'
import { createPost, deletePost, listFeed, timeAgo } from './lib/posts'
import type { Post } from './lib/posts'
import { NewPost } from './screens/NewPost'
import { Sheet } from './components/blocks/Sheet'
import { ComposerPrompt } from './components/blocks/ComposerPrompt'
import { go, goBack, useRoute } from './lib/router'
import { availabilityLabel, getSitterProfile, listSitters, priceSummary, removeSitterProfile, saveSitterProfile } from './lib/sitters'
import type { SitterListing, SitterProfile } from './lib/sitters'

/**
 * Everything after logging in.
 *   Setup, in order: 1. Set up your profile  2. How will you use Homami?
 *                    3. Add your first pet (unless you only offer care)  4. Pet sitter profile (if you offer care)
 *   Then the app:   Home · Circle · Chats (bottom nav), Your profile (your photo, top left),
 *                   Invite friends, people's profiles, chats, pet care requests (create / edit),
 *                   booking a sitter, Your bookings and Payment details.
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
  const [openRequests, setOpenRequests] = useState<RequestListing[] | undefined>(undefined)
  const [extended, setExtended] = useState<CircleMember[] | undefined>(undefined)
  const [wallFilter, setWallFilter] = useState<WallFilter>('all')
  const [chats, setChats] = useState<ChatSummary[] | undefined>(undefined)
  const [chatsError, setChatsError] = useState<string | null>(null)
  // Bookings and payment details (script 11). Loaded on their own, like requests, so they never block the app.
  const [bookings, setBookings] = useState<BookingListing[] | undefined>(undefined)
  const [bookingsError, setBookingsError] = useState<string | null>(null)
  const [payment, setPayment] = useState<PaymentProfile | null | undefined>(undefined)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const refreshBookings = useCallback(() => {
    listMyBookings()
      .then((list) => {
        setBookings(list)
        setBookingsError(null)
      })
      .catch((err) => {
        setBookings((l) => l ?? [])
        setBookingsError(err instanceof Error ? err.message : null)
      })
  }, [])
  const refreshPayment = useCallback(() => {
    getPaymentProfile(userId)
      .then((p) => {
        setPayment(p)
        setPaymentError(null)
      })
      .catch((err) => {
        setPayment(null)
        setPaymentError(err instanceof Error ? err.message : null)
      })
  }, [userId])
  useEffect(() => {
    refreshBookings()
    refreshPayment()
  }, [refreshBookings, refreshPayment])
  // Coming back from Stripe's payout setup (…#/payments?payouts=back): ask Stripe whether it's done
  useEffect(() => {
    if (!route.startsWith('/payments?payouts=')) return
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/payments`)
    callPayments('payouts-refresh').catch(() => {}).finally(refreshPayment)
  }, [route, refreshPayment])
  // Your one-time invite codes (script 12), loaded when you open Your profile
  const [inviteCodes, setInviteCodes] = useState<InviteCode[] | undefined>(undefined)
  const [inviteCodesError, setInviteCodesError] = useState<string | null>(null)
  const refreshInviteCodes = useCallback(
    () =>
      listMyInviteCodes(userId)
        .then(setInviteCodes)
        .catch(() => setInviteCodes([])),
    [userId],
  )
  useEffect(() => {
    if (route === '/profile') refreshInviteCodes()
  }, [route, refreshInviteCodes])
  const inviteCodeActions = async (action: () => Promise<unknown>) => {
    setInviteCodesError(null)
    try {
      await action()
    } catch (err) {
      setInviteCodesError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
    await refreshInviteCodes()
  }
  // Opening Your bookings shows the latest answers
  useEffect(() => {
    if (route === '/bookings') refreshBookings()
  }, [route, refreshBookings])

  // Your open pet care requests. Loaded on their own so a missing database script 10 never blocks the app.
  const [requests, setRequests] = useState<CareRequestRow[] | undefined>(undefined)
  useEffect(() => {
    let cancelled = false
    listRequestsOf(userId)
      .then((list) => !cancelled && setRequests(list))
      .catch(() => !cancelled && setRequests([]))
    return () => {
      cancelled = true
    }
  }, [userId])

  const refreshChats = useCallback(() => {
    listChats()
      .then((list) => {
        setChats(list)
        setChatsError(null)
      })
      .catch((err) => {
        setChats((l) => l ?? [])
        setChatsError(err instanceof Error ? err.message : null)
      })
  }, [])

  // Chats: load them, refresh when a message arrives or you come back to the app, and on the Chats tab
  useEffect(() => {
    refreshChats()
    const stop = onNewMessage(userId, refreshChats)
    const onVisible = () => document.visibilityState === 'visible' && refreshChats()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [userId, refreshChats])
  useEffect(() => {
    if (route === '/chats') refreshChats()
  }, [route, refreshChats])
  const unreadChats = chats?.filter((c) => c.unread > 0).length ?? 0

  const refreshCircle = useCallback(() => {
    getMyCircle().then(setCircle).catch(() => setCircle([]))
  }, [])

  // The wall: load posts and pet sitters whenever Home is opened, so new ones show up
  useEffect(() => {
    if (route !== '/') return
    let cancelled = false
    listFeed().then((list) => !cancelled && setFeed(list)).catch(() => !cancelled && setFeed((f) => f ?? []))
    listSitters(userId).then((list) => !cancelled && setSitters(list)).catch(() => !cancelled && setSitters((l) => l ?? []))
    listOpenRequests(userId).then((list) => !cancelled && setOpenRequests(list)).catch(() => !cancelled && setOpenRequests((l) => l ?? []))
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

  // The bottom nav stays on the pages you browse (Your profile, Invite, someone's profile).
  // Forms (Edit profile, Add/Edit pet, pet sitter profile) hide it, so you finish or go back.
  const goTab = (t: string) => {
    setEditingProfile(false)
    setPetStep({ step: 'none' })
    go(t === 'home' ? '/' : `/${t}`)
  }
  const withNav = (page: ReactNode) => (
    <WithBottomNav onTab={goTab} unreadChats={unreadChats}>
      {page}
    </WithBottomNav>
  )

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
  // Log out from the ≡ menu (on every main page and on Your profile)
  const handleLogOut = () =>
    logOut().then(() => {
      go('/')
      onLoggedOut()
    })

  // ---- Pages -----------------------------------------------------------------------------------
  if (route === '/profile') {
    return withNav(
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
        requests={requests}
        // People who only offer care don't get asked whether they need it
        onNewRequest={wants !== 'offer' || pets.length > 0 ? () => go('/requests/new') : undefined}
        onOpenRequest={(id) => go(`/requests/${id}`)}
        onBookings={() => go('/bookings')}
        bookingsWaiting={bookings?.filter((b) => b.status === 'requested' && b.sitter_id === userId).length ?? 0}
        onPayments={() => go('/payments')}
        invite={{
          codes: inviteCodes,
          error: inviteCodesError,
          linkFor: inviteLinkFor,
          onCreate: () => inviteCodeActions(createInviteCode),
          onRemove: (code) => inviteCodeActions(() => removeInviteCode(code)),
        }}
        onLogOut={handleLogOut}
      />
    )
  }

  // ---- Payment details and Your bookings (script 11) ---------------------------------------------
  if (route.startsWith('/payments')) {
    return (
      <PaymentDetails
        profile={paymentError ? null : payment}
        loadError={paymentError}
        isSitter={!!sitter}
        configured={paymentsConfigured}
        onCardSaved={refreshPayment}
        onRemoveCard={async () => {
          await callPayments('card-remove')
          refreshPayment()
        }}
        onSetUpPayouts={async () => {
          const { url } = await callPayments<{ url: string }>('payouts-start', { returnPath: '/#/payments' })
          window.location.assign(url)
        }}
        onBack={goBack}
      />
    )
  }
  if (route === '/bookings') {
    return withNav(
      <Bookings
        me={userId}
        bookings={bookings}
        loadError={bookingsError}
        onAccept={async (b) => {
          await acceptBooking(b)
          refreshBookings()
        }}
        onDecline={async (b) => {
          await declineBooking(b.id)
          refreshBookings()
        }}
        onCancel={async (b) => {
          await cancelBooking(b.id)
          refreshBookings()
        }}
        onOpenPerson={(id) => go(`/people/${id}`)}
        onBack={goBack}
      />,
    )
  }
  const bookMatch = route.match(/^\/book\/([0-9a-f-]+)$/)
  if (bookMatch) {
    return (
      <BookRoute
        key={bookMatch[1]}
        sitterId={bookMatch[1]}
        pets={pets.map(toSummary)}
        card={payment ? cardLabel(payment) : null}
        onAddCard={() => go('/payments')}
        onBooked={() => {
          refreshBookings()
          window.location.replace('#/bookings')
        }}
      />
    )
  }

  // ---- Pet care requests: create one, or edit / remove yours (forms: no bottom nav) ------------
  const requestMatch = route.match(/^\/requests\/(new|[0-9a-f-]+)$/)
  if (requestMatch) {
    const isNew = requestMatch[1] === 'new'
    const existing = isNew ? undefined : requests?.find((r) => r.id === requestMatch[1])
    if (!isNew && requests === undefined) return null // still loading
    if (isNew || existing) {
      return (
        <CareRequest
          key={existing?.id ?? 'new'}
          mode={existing ? 'edit' : 'new'}
          initial={existing}
          ownerName={profile.first_name}
          pets={pets.map(toSummary)}
          defaultArea={profile.city}
          onBack={goBack}
          onSubmit={async (values) => {
            const saved = existing ? await updateRequest(existing.id, values) : await createRequest(userId, values)
            setRequests((list) =>
              [...(list ?? []).filter((r) => r.id !== saved.id), saved].sort((a, b) => a.start_date.localeCompare(b.start_date)),
            )
            goBack()
          }}
          onRemove={
            existing
              ? async () => {
                  await removeRequest(existing.id)
                  setRequests((list) => list?.filter((r) => r.id !== existing.id))
                  goBack()
                }
              : undefined
          }
        />
      )
    }
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
    return withNav(<InviteFriends link={inviteLink} code={inviteCode} onBack={goBack} />)
  }

  const personMatch = route.match(/^\/people\/([0-9a-f-]+)$/)
  if (personMatch) {
    const id = personMatch[1]
    return withNav(
      <PersonRoute
        id={id}
        inCircle={circle ? circle.some((m) => m.id === id) : true}
        chattedWith={!!chats?.some((c) => c.other_id === id)}
        isMe={id === userId}
        onBook={() => go(`/book/${id}`)}
      />,
    )
  }

  // ---- A chat (full screen, no bottom nav: the message bar sits at the bottom) ------------------
  const chatMatch = route.match(/^\/chats\/([0-9a-f-]+)$/)
  if (chatMatch) {
    const id = chatMatch[1]
    return <ChatRoute key={id} me={userId} otherId={id} inCircle={circle ? circle.some((m) => m.id === id) : false} onChanged={refreshChats} />
  }

  const tab = route === '/circle' || route === '/circle/extended' ? 'circle' : route === '/chats' ? 'chats' : 'home'
  const newPostOpen = route === '/new-post' // New post opens in a Sheet over the wall
  const goCircleView = (v: 'circle' | 'extended') => go(v === 'circle' ? '/circle' : '/circle/extended')
  const circleIds = new Set(circle?.map((m) => m.id))
  const myCity = profile.city?.trim().toLowerCase()
  // ---- The wall: your circle's posts, with pet sitters in between --------------------------------
  // Sitters are ranked: your circle, your extended circle, your city, then everyone else.
  // With no circle yet, the wall is all sitters.
  const extendedIds = new Set(extended?.map((m) => m.id))
  // Pet sitters and people asking for care are placed the same way: circle, extended circle, your city, everyone else
  const relationOf = (s: { user_id: string; profile: { city: string | null } | null }) => {
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
  const requestItems: (WallItem & { group: string })[] =
    openRequests
      ?.map((r) => ({ r, rel: relationOf({ user_id: r.owner_id, profile: r.owner }) }))
      .sort((a, b) => a.rel.rank - b.rel.rank) // already soonest first within each group (stable sort)
      .map(({ r, rel }) => ({
        kind: 'request' as const,
        id: r.id,
        ownerId: r.owner_id,
        group: rel.group,
        name: r.owner?.first_name ?? 'Someone',
        photoUrl: r.owner?.avatar_url,
        relation: rel.label,
        needs: r.needs,
        startDate: r.start_date,
        endDate: r.end_date,
        area: r.area,
      })) ?? []
  /** Sitters and requests take turns, so neither crowds the other out */
  const alternate = (a: WallItem[], b: WallItem[]) => {
    const out: WallItem[] = []
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (i < a.length) out.push(a[i])
      if (i < b.length) out.push(b[i])
    }
    return out
  }
  const inGroup = (group: string) => (x: { group: string }) => x.group === group
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
    feed === undefined || sitters === undefined || openRequests === undefined
      ? undefined
      : wallFilter === 'sitters'
        ? sitterItems
        : wallFilter === 'requests'
          ? requestItems
          : wallFilter === 'extended'
            ? alternate(sitterItems.filter(inGroup('extended')), requestItems.filter(inGroup('extended')))
            : wallFilter === 'circle'
              ? mix(postItems, alternate(sitterItems.filter(inGroup('circle')), requestItems.filter(inGroup('circle'))))
              : mix(postItems, alternate(sitterItems, requestItems))

  return (
    <AppLayout
      me={me}
      tab={tab}
      onTab={goTab}
      onOpenProfile={() => go('/profile')}
      onLogOut={handleLogOut}
      unreadChats={unreadChats}
      headerMiddle={tab === 'home' ? <ComposerPrompt name={me.name} showAvatar={false} onOpen={() => go('/new-post')} /> : undefined}
    >
      {route === '/circle/extended' ? (
        <CirclePage view="extended" onView={goCircleView} showInvite={(circle?.length ?? 0) > 0} onInvite={() => go('/invite')}>
          <ExtendedCircleContent
            hasCircle={(circle?.length ?? 0) > 0}
            people={extended?.map((m) => ({ id: m.id, name: m.first_name ?? 'New member', city: m.city, photoUrl: m.avatar_url, sharedCount: m.shared_count }))}
            onOpenPerson={(id) => go(`/people/${id}`)}
          />
        </CirclePage>
      ) : tab === 'chats' ? (
        <ChatsContent chats={chats} error={chatsError} onOpen={(id) => go(`/chats/${id}`)} />
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
          hasCircle={(circle?.length ?? 0) > 0}
          items={wallItems}
          filter={wallFilter}
          onFilter={setWallFilter}
          iAmSitter={!!sitter}
          onInvite={() => go('/invite')}
          onOpenSitter={(id) => go(`/people/${id}`)}
          onOpenRequest={(id) => go(`/people/${id}`)}
          onBecomeSitter={() => go('/sitter')}
        />
      )}
      <Sheet open={newPostOpen} onClose={goBack} label="New post">
        <NewPost
          variant="sheet"
          pets={pets.map((p) => ({ id: p.id, name: p.name, photoUrl: p.photo_url }))}
          onBack={goBack}
          onSubmit={async (values) => {
            const post = await createPost(userId, values)
            setFeed((list) => [post, ...(list ?? [])])
            goBack()
          }}
        />
      </Sheet>
    </AppLayout>
  )
}

/** Loads one person (in your circle, or a pet sitter), their pets and their pet sitting */
function PersonRoute({ id, inCircle, chattedWith, isMe, onBook }: { id: string; inCircle: boolean; chattedWith: boolean; isMe: boolean; onBook: () => void }) {
  const [person, setPerson] = useState<PersonProfile | null | undefined>(undefined)
  const [pets, setPets] = useState<Pet[] | undefined>(undefined)
  const [sitter, setSitter] = useState<SitterProfile | null>(null)
  const [requests, setRequests] = useState<CareRequestRow[]>([])
  useEffect(() => {
    let cancelled = false
    getPerson(id).then((p) => !cancelled && setPerson(p)).catch(() => !cancelled && setPerson(null))
    listRequestsOf(id).then((list) => !cancelled && setRequests(list)).catch(() => {})
    listPetsOf(id).then((list) => !cancelled && setPets(list)).catch(() => !cancelled && setPets([]))
    getSitterProfile(id).then((s) => !cancelled && setSitter(s)).catch(() => {})
    return () => {
      cancelled = true
    }
  }, [id])
  // You can message people in your circle, pet sitters, people asking for pet care (script 10),
  // and anyone you already have a chat with
  const canMessage = !isMe && (inCircle || !!sitter || requests.length > 0 || chattedWith)
  return (
    <PersonPage
      person={person && { name: person.first_name ?? 'New member', photoUrl: person.avatar_url, city: person.city, bio: person.bio }}
      pets={inCircle ? pets?.map(toSummary) : null}
      sitter={sitter}
      requests={requests}
      onBook={sitter && !isMe ? onBook : undefined}
      onBack={goBack}
      onMessage={canMessage ? () => go(`/chats/${id}`) : undefined}
    />
  )
}

/** Loads a pet sitter (their prices and whether they can be paid) for the Book screen */
function BookRoute({ sitterId, pets, card, onAddCard, onBooked }: { sitterId: string; pets: PetSummary[]; card: string | null; onAddCard: () => void; onBooked: () => void }) {
  const [person, setPerson] = useState<PersonProfile | null | undefined>(undefined)
  const [sitter, setSitter] = useState<SitterProfile | null | undefined>(undefined)
  const [payable, setPayable] = useState(false)
  useEffect(() => {
    let cancelled = false
    getPerson(sitterId).then((p) => !cancelled && setPerson(p)).catch(() => !cancelled && setPerson(null))
    getSitterProfile(sitterId).then((s) => !cancelled && setSitter(s)).catch(() => !cancelled && setSitter(null))
    canBePaid(sitterId).then((ok) => !cancelled && setPayable(ok))
    return () => {
      cancelled = true
    }
  }, [sitterId])
  if (person === undefined || sitter === undefined) return null
  if (!person || !sitter) {
    return (
      <PersonPage person={null} pets={null} onBack={goBack} />
    )
  }
  return (
    <BookSitter
      sitterName={person.first_name ?? 'this sitter'}
      sitter={sitter}
      sitterCanBePaid={payable}
      pets={pets}
      card={card}
      onAddCard={onAddCard}
      onSubmit={async (values) => {
        await requestBooking(sitterId, values)
        onBooked()
      }}
      onBack={goBack}
    />
  )
}

/**
 * One chat. Messages arrive straight away (and are checked again every 15 seconds, in case the
 * live connection drops). What you send shows at once, faded until it's saved; if it fails you can try again.
 */
function ChatRoute({ me, otherId, inCircle, onChanged }: { me: string; otherId: string; inCircle: boolean; onChanged: () => void }) {
  const [person, setPerson] = useState<{ name: string; photoUrl: string | null } | null | undefined>(undefined)
  const [isSitter, setIsSitter] = useState(false)
  const [messages, setMessages] = useState<ThreadMessage[] | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const onChangedRef = useRef(onChanged)
  onChangedRef.current = onChanged

  // Server messages, plus anything of yours still sending or failed
  const merge = useCallback((fromServer: ThreadMessage[]) => {
    setMessages((current) => [...fromServer, ...(current ?? []).filter((m) => m.status === 'sending' || m.status === 'failed')])
  }, [])

  const reload = useCallback(
    (markRead: boolean) =>
      getMessages(me, otherId)
        .then((list) => {
          merge(list)
          if (markRead && list.some((m) => m.sender_id === otherId && !m.read_at)) {
            markChatRead(otherId).then(() => onChangedRef.current())
          }
        })
        .catch((err) => {
          setMessages((m) => m ?? [])
          setError(err instanceof Error ? err.message : null)
        }),
    [me, otherId, merge],
  )

  useEffect(() => {
    let cancelled = false
    getPerson(otherId)
      .then((p) => !cancelled && setPerson(p ? { name: p.first_name ?? 'Homami member', photoUrl: p.avatar_url } : null))
      .catch(() => !cancelled && setPerson(null))
    getSitterProfile(otherId)
      .then((s) => !cancelled && setIsSitter(!!s))
      .catch(() => {})
    reload(true)
    const stop = onNewMessage(me, (m) => {
      if (m.sender_id !== otherId) return
      setMessages((list) => (list?.some((x) => x.id === m.id) ? list : [...(list ?? []), m]))
      markChatRead(otherId).then(() => onChangedRef.current())
    })
    const timer = window.setInterval(() => document.visibilityState === 'visible' && reload(true), 15000)
    return () => {
      cancelled = true
      stop()
      window.clearInterval(timer)
    }
  }, [me, otherId, reload])

  const send = (text: string) => {
    const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const draft: ThreadMessage = { id: localId, sender_id: me, recipient_id: otherId, body: text, created_at: new Date().toISOString(), read_at: null, status: 'sending' }
    setError(null)
    setMessages((list) => [...(list ?? []), draft])
    sendMessage(me, otherId, text)
      .then((saved) => {
        setMessages((list) => list?.map((m) => (m.id === localId ? saved : m)))
        onChangedRef.current()
      })
      .catch((err) => {
        setMessages((list) => list?.map((m) => (m.id === localId ? { ...m, status: 'failed' } : m)))
        setError(err instanceof Error ? err.message : null)
      })
  }

  return (
    <ChatThread
      me={me}
      person={person}
      messages={messages}
      showBookingTips={isSitter && !inCircle}
      error={error}
      onSend={send}
      onRetry={(m) => {
        setMessages((list) => list?.filter((x) => x.id !== m.id))
        send(m.body)
      }}
      onBack={goBack}
      onOpenProfile={() => go(`/people/${otherId}`)}
    />
  )
}
