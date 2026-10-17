import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { SignUp } from './screens/SignUp'
import { LogIn } from './screens/LogIn'
import { WelcomeLayout } from './screens/WelcomeLayout'
import { Button } from './components/basics/Button'
import { supabase } from './lib/supabase'
import { logIn, logOut, signUp } from './lib/auth'
import { getMyProfile, saveMyProfile } from './lib/profile'
import type { Profile } from './lib/profile'
import { SetUpProfile } from './screens/SetUpProfile'
import { Avatar } from './components/basics/Avatar'

/** An invite link looks like https://…/?invite=LUNA42 — the code is filled in for the person. */
function inviteFromLink() {
  return new URLSearchParams(window.location.search).get('invite') ?? ''
}

type Screen = { name: 'signup' } | { name: 'login' } | { name: 'check-email'; email: string }

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined) // undefined = still checking
  const [screen, setScreen] = useState<Screen>({ name: 'signup' })

  const [profile, setProfile] = useState<Profile | null | undefined>(undefined) // undefined = still loading

  // Stay logged in between visits, and react to logging in / out (also from the email link)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  // Once logged in, fetch the person's profile to know whether they've set it up
  const userId = session?.user.id
  useEffect(() => {
    if (!userId) return setProfile(undefined)
    let cancelled = false
    getMyProfile(userId)
      .then((p) => !cancelled && setProfile(p))
      .catch(() => !cancelled && setProfile(null))
    return () => {
      cancelled = true
    }
  }, [userId])

  if (session === undefined) return null // a split second while we check

  if (session) {
    if (profile === undefined) return null // loading the profile
    if (!profile?.first_name) {
      return (
        <SetUpProfile
          initial={{ firstName: profile?.first_name, city: profile?.city, avatarUrl: profile?.avatar_url }}
          onSubmit={async (values) => setProfile(await saveMyProfile(session.user.id, values))}
        />
      )
    }
    // Temporary stand-in until "Add your pet" is built.
    return (
      <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center gap-xl px-l text-center">
        <Avatar size="xlarge" name={profile.first_name} src={profile.avatar_url ?? undefined} />
        <h1 className="text-title-large text-dark-sage">Hi {profile.first_name}!</h1>
        <p className="text-body text-medium-grey">Your profile is saved. Adding your pet is the next screen we build.</p>
        <div className="flex gap-m">
          <Button variant="outline" onClick={() => setProfile({ ...profile, first_name: null })}>
            Edit profile
          </Button>
          <Button variant="ghost" onClick={() => logOut().then(() => setScreen({ name: 'login' }))}>
            Log out
          </Button>
        </div>
      </main>
    )
  }

  if (screen.name === 'check-email') {
    return (
      <WelcomeLayout title="Check your inbox" subtitle={`We sent a link to ${screen.email}. Tap it to finish creating your profile.`}>
        <Button variant="outline" onClick={() => setScreen({ name: 'login' })}>
          Back to log in
        </Button>
      </WelcomeLayout>
    )
  }

  if (screen.name === 'login') {
    return <LogIn onSubmit={logIn} onSignUp={() => setScreen({ name: 'signup' })} />
  }

  return (
    <SignUp
      initialInviteCode={inviteFromLink()}
      onSubmit={async (values) => {
        const result = await signUp(values)
        if (result.status === 'check-email') setScreen({ name: 'check-email', email: result.email })
      }}
      onLogIn={() => setScreen({ name: 'login' })}
    />
  )
}
