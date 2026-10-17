import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { SignUp } from './screens/SignUp'
import { LogIn } from './screens/LogIn'
import { WelcomeLayout } from './screens/WelcomeLayout'
import { Button } from './components/basics/Button'
import { supabase } from './lib/supabase'
import { logIn, signUp } from './lib/auth'
import { LoggedIn } from './LoggedIn'

/** An invite link looks like https://…/?invite=LUNA42 — the code is filled in for the person. */
function inviteFromLink() {
  return new URLSearchParams(window.location.search).get('invite') ?? ''
}

type Screen = { name: 'signup' } | { name: 'login' } | { name: 'check-email'; email: string }

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined) // undefined = still checking
  const [screen, setScreen] = useState<Screen>({ name: 'signup' })

  // Stay logged in between visits, and react to logging in / out (also from the email link)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  if (session === undefined) return null // a split second while we check

  if (session) {
    return <LoggedIn key={session.user.id} session={session} onLoggedOut={() => setScreen({ name: 'login' })} />
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
