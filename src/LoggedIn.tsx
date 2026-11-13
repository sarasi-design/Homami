import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { SetUpProfile } from './screens/SetUpProfile'
import { MyProfile } from './screens/MyProfile'
import { PetType } from './screens/PetType'
import type { PetKind } from './screens/PetType'
import { AddPet } from './screens/AddPet'
import { WithBottomNav } from './screens/AppLayout'
import { InviteFriends, JoinCircle } from './screens/CircleScreens'
import type { WallFilter } from './screens/CircleScreens'
import { HowWillYouUse } from './screens/HowWillYouUse'
import { SitterSetup } from './screens/SitterSetup'
import { CareRequest } from './screens/CareRequest'
import { Bookings } from './screens/Bookings'
import { CancelBooking } from './screens/CancelBooking'
import { Help } from './screens/Help'
import { PaymentDetails } from './screens/PaymentDetails'
import { cancelWithReason, cancellationMessage } from './lib/cancellation'
import { acceptBooking, cancelBooking, declineBooking } from './lib/bookings'
import { callPayments, cardLabel } from './lib/payments'
import { paymentsConfigured } from './lib/stripe'
import { createRequest, removeRequest, updateRequest } from './lib/requests'
import { saveMyProfile, saveWants } from './lib/profile'
import { addPet, removePet, updatePet } from './lib/pets'
import { createInviteCode, inviteLinkFor, removeInviteCode } from './lib/circle'
import { sendMessage } from './lib/chat'
import { logOut } from './lib/auth'
import { removeSitterProfile, saveSitterProfile } from './lib/sitters'
import { go, goBack, useRoute } from './lib/router'
import { useMe, useSetupSkips } from './hooks/useMe'
import { useCircle, useInviteCodes } from './hooks/useCircle'
import { useMyRequests, useWall } from './hooks/useWall'
import { useChats } from './hooks/useChats'
import { useBookings, usePaymentProfile } from './hooks/useBookings'
import { toPetSummary } from './routes/petSummary'
import { PersonRoute } from './routes/PersonRoute'
import { BookRoute } from './routes/BookRoute'
import { ChatRoute } from './routes/ChatRoute'
import type { BookingActions } from './routes/ChatRoute'
import { MainTabs } from './routes/MainTabs'

/**
 * Everything after logging in: which page to show. What each page needs is loaded by the hooks in src/hooks,
 * and the bigger pages live in src/routes.
 *   Setup, in order: 1. Set up your profile  2. How will you use Homami?
 *                    3. Add your first pet (unless you only offer care)  4. Pet sitter profile (if you offer care)
 *   Then the app:   Home · Circle · Chats (bottom nav), Your profile (your photo, top left),
 *                   Invite friends, people's profiles, chats, pet care requests (create / edit),
 *                   booking a sitter, Your bookings and Payment details.
 *   Opening someone's invite link while logged in asks "Add Sara to your circle?"
 */
type PetStep = { step: 'none' } | { step: 'type' } | { step: 'form'; kind: PetKind }

export function LoggedIn({ session, onLoggedOut }: { session: Session; onLoggedOut: () => void }) {
  const userId = session.user.id
  const route = useRoute()
  const { profile, setProfile, pets, setPets, sitter, setSitter } = useMe(userId)
  const { skippedPet, skippedSitter, skipPet, skipSitter } = useSetupSkips(userId)
  const [editingProfile, setEditingProfile] = useState(false)
  const [petStep, setPetStep] = useState<PetStep>({ step: 'none' })
  const [wallFilter, setWallFilter] = useState<WallFilter>('all')
  const circle = useCircle(userId)
  const wall = useWall(userId, route)
  const { requests, setRequests } = useMyRequests(userId)
  const chats = useChats(userId, route)
  const bookings = useBookings(route)
  const payments = usePaymentProfile(userId, route)
  const inviteCodes = useInviteCodes(userId, route)

  if (profile === undefined || pets === undefined || sitter === undefined) return null // loading

  // The bottom nav stays on the pages you browse (Your profile, Invite, someone's profile).
  // Forms (Edit profile, Add/Edit pet, pet sitter profile) hide it, so you finish or go back.
  const goTab = (t: string) => {
    setEditingProfile(false)
    setPetStep({ step: 'none' })
    go(t === 'home' ? '/' : `/${t}`)
  }
  const withNav = (page: ReactNode) => (
    <WithBottomNav onTab={goTab} unreadChats={chats.unread}>
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
        onSkip={needsFirstPet ? skipPet : undefined}
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
          skipSitter()
          if (fromProfile) goBack()
        }}
        onSubmit={async (values) => {
          setSitter(await saveSitterProfile(userId, values))
          wall.forgetSitters()
          if (fromProfile) goBack()
        }}
        onRemove={async () => {
          await removeSitterProfile(userId)
          skipSitter()
          setSitter(null)
          wall.forgetSitters()
          goBack()
        }}
      />
    )
  }

  // ---- Someone's invite link -------------------------------------------------------------------
  if (circle.pendingInvite) {
    return (
      <JoinCircle
        inviter={{ name: circle.pendingInvite.name, photoUrl: circle.pendingInvite.photoUrl }}
        busy={circle.joining}
        error={circle.joinError}
        onAccept={circle.acceptInvite}
        onDecline={circle.declineInvite}
      />
    )
  }

  const me = { name: profile.first_name, photoUrl: profile.avatar_url }
  const petSummaries = pets.map(toPetSummary)
  // Accept / Decline / Cancel a booking, from Your bookings or from a chat
  const bookingActions: BookingActions = {
    onAccept: async (b) => {
      await acceptBooking(b)
      bookings.refresh()
    },
    onDecline: async (b) => {
      await declineBooking(b.id)
      bookings.refresh()
    },
    onCancel: async (b) => {
      await cancelBooking(b.id)
      bookings.refresh()
    },
    onCancelBooking: (b) => go(`/bookings/${b.id}/cancel`),
  }
  // Requests other people sent you as a sitter, waiting for your yes or no (a badge on your photo and on Your bookings)
  const bookingsWaiting = bookings.bookings?.filter((b) => b.status === 'requested' && b.sitter_id === userId).length ?? 0
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
        pets={petSummaries}
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
        bookingsWaiting={bookingsWaiting}
        onPayments={() => go('/payments')}
        invite={{
          codes: inviteCodes.codes,
          error: inviteCodes.error,
          linkFor: inviteLinkFor,
          onCreate: () => inviteCodes.run(createInviteCode),
          onRemove: (code) => inviteCodes.run(() => removeInviteCode(code)),
        }}
        onLogOut={handleLogOut}
        onHelp={() => go('/help')}
      />,
    )
  }

  // ---- Find out more (how Homami works) -------------------------------------------------------
  const helpMatch = route.match(/^\/help(?:\/([a-z]+))?$/)
  if (helpMatch) return <Help topic={helpMatch[1]} onBack={goBack} />

  // ---- Payment details and Your bookings (script 11) ---------------------------------------------
  if (route.startsWith('/payments')) {
    return (
      <PaymentDetails
        profile={payments.error ? null : payments.payment}
        loadError={payments.error}
        isSitter={!!sitter}
        configured={paymentsConfigured}
        onCardSaved={payments.refresh}
        onRemoveCard={async () => {
          await callPayments('card-remove')
          payments.refresh()
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
        bookings={bookings.bookings}
        loadError={bookings.error}
        {...bookingActions}
        onOpenPerson={(id) => go(`/people/${id}`)}
        onHelp={() => go('/help/cancelling')}
        onBack={goBack}
      />,
    )
  }
  // Cancel a booking: say why; paid ones are refunded by the cancellation rules (script 15)
  const cancelMatch = route.match(/^\/bookings\/([0-9a-f-]+)\/cancel$/)
  if (cancelMatch) {
    if (bookings.bookings === undefined) return null // still loading
    const booking = bookings.bookings.find((b) => b.id === cancelMatch[1])
    if (!booking) {
      window.location.replace('#/bookings')
      return null
    }
    const otherId = booking.sitter_id === userId ? booking.owner_id : booking.sitter_id
    return (
      <CancelBooking
        me={userId}
        booking={booking}
        onHowItWorks={() => go('/help/cancelling')}
        onBack={goBack}
        onSubmit={async (reason, note) => {
          const done = await cancelWithReason(booking, reason, note)
          // The booking is already cancelled, so a message that doesn't send never undoes it
          await sendMessage(userId, otherId, cancellationMessage(booking, userId, reason, note, done.refund_cents ?? 0)).catch((err) =>
            console.warn('The cancellation message didn’t send', err),
          )
          bookings.refresh()
          chats.refresh()
          window.location.replace(`#/chats/${otherId}`)
        }}
      />
    )
  }
  const bookMatch = route.match(/^\/book\/([0-9a-f-]+)$/)
  if (bookMatch) {
    return (
      <BookRoute
        key={bookMatch[1]}
        me={userId}
        sitterId={bookMatch[1]}
        pets={petSummaries}
        card={payments.payment ? cardLabel(payments.payment) : null}
        onAddCard={() => go('/payments')}
        // After asking, you land in your chat with the sitter, where the request now shows
        onBooked={() => {
          bookings.refresh()
          chats.refresh()
          window.location.replace(`#/chats/${bookMatch[1]}`)
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
          pets={petSummaries}
          defaultArea={profile.city}
          onBack={goBack}
          onSubmit={async (values) => {
            const saved = existing ? await updateRequest(existing.id, values) : await createRequest(userId, values)
            setRequests((list) => [...(list ?? []).filter((r) => r.id !== saved.id), saved].sort((a, b) => a.start_date.localeCompare(b.start_date)))
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

  // ---- Edit or remove one of your pets -----------------------------------------------------------
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
          if (pets.length === 1) skipPet()
          setPets((list) => list?.filter((p) => p.id !== editingPet.id))
          goBack()
        }}
      />
    )
  }

  if (route === '/invite') {
    const inviteLink = circle.inviteCode ? inviteLinkFor(circle.inviteCode) : null
    return withNav(<InviteFriends link={inviteLink} code={circle.inviteCode} onBack={goBack} />)
  }

  const personMatch = route.match(/^\/people\/([0-9a-f-]+)$/)
  if (personMatch) {
    const id = personMatch[1]
    return withNav(
      <PersonRoute
        id={id}
        inCircle={circle.circle ? circle.circle.some((m) => m.id === id) : true}
        chattedWith={!!chats.chats?.some((c) => c.other_id === id)}
        isMe={id === userId}
        onBook={() => go(`/book/${id}`)}
      />,
    )
  }

  // ---- A chat (full screen, no bottom nav: the message bar sits at the bottom) ------------------
  const chatMatch = route.match(/^\/chats\/([0-9a-f-]+)$/)
  if (chatMatch) {
    const id = chatMatch[1]
    return (
      <ChatRoute
        key={id}
        me={userId}
        otherId={id}
        inCircle={circle.circle ? circle.circle.some((m) => m.id === id) : false}
        onChanged={chats.refresh}
        bookings={(bookings.bookings ?? []).filter((b) => b.owner_id === id || b.sitter_id === id)}
        bookingActions={bookingActions}
        onRefreshBookings={bookings.refresh}
      />
    )
  }

  // ---- Home, Circle and Chats ------------------------------------------------------------------
  return (
    <MainTabs
      route={route}
      userId={userId}
      me={me}
      myCity={profile.city}
      pets={pets}
      iAmSitter={!!sitter}
      circle={circle.circle}
      extended={wall.extended}
      feed={wall.feed}
      onFeedChange={wall.setFeed}
      sitters={wall.sitters}
      openRequests={wall.openRequests}
      chats={chats.chats}
      chatsError={chats.error}
      unreadChats={chats.unread}
      bookingsWaiting={bookingsWaiting}
      wallFilter={wallFilter}
      onWallFilter={setWallFilter}
      onTab={goTab}
      onLogOut={handleLogOut}
    />
  )
}
