import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { SignUp } from './screens/SignUp'
import { LogIn } from './screens/LogIn'
import { WelcomeLayout } from './screens/WelcomeLayout'
import { ForgotPassword, NewPassword, ResetLinkSent } from './screens/PasswordReset'
import { Button } from './components/basics/Button'
import { supabase } from './lib/supabase'
import { logIn, messages, sendPasswordReset, setNewPassword, signUp } from './lib/auth'
import { LoggedIn } from './LoggedIn'

/** An invite link looks like https://…/?invite=LUNA42 — the code is filled in for the person. */
function inviteFromLink() {
  return new URLSearchParams(window.location.search).get('invite') ?? ''
}

/**
 * Opened from a "choose a new password" email? Read it now, before Supabase tidies the link away.
 * (Supabase also announces it with a PASSWORD_RECOVERY event, listened to below.)
 */
const openedFromResetLink = window.location.hash.includes('type=recovery')

/** An old or already-used email link comes back as #error=…: say so on Log in, and tidy the address. */
const expiredLink = /error_code=otp_expired|error=access_denied/.test(window.location.hash)
if (expiredLink) window.history.replaceState(null, '', window.location.pathname + window.location.search)

type Screen =
  | { name: 'signup' }
  | { name: 'login' }
  | { name: 'check-email'; email: string }
  | { name: 'forgot'; email: string }
  | { name: 'reset-sent'; email: string }

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined) // undefined = still checking
  const [screen, setScreen] = useState<Screen>(expiredLink ? { name: 'login' } : { name: 'signup' })
  const [choosingPassword, setChoosingPassword] = useState(openedFromResetLink)

  // Stay logged in between visits, and react to logging in / out (also from the email link)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'PASSWORD_RECOVERY') setChoosingPassword(true)
      setSession(next)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  if (session === undefined) return null // a split second while we check

  if (session && choosingPassword) {
    return (
      <NewPassword
        onSubmit={async (password) => {
          await setNewPassword(password)
          setChoosingPassword(false)
        }}
      />
    )
  }

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

  if (screen.name === 'forgot') {
    return (
      <ForgotPassword
        initialEmail={screen.email}
        onSubmit={async (email) => {
          await sendPasswordReset(email)
          setScreen({ name: 'reset-sent', email })
        }}
        onBack={() => setScreen({ name: 'login' })}
      />
    )
  }

  if (screen.name === 'reset-sent') {
    return <ResetLinkSent email={screen.email} onBack={() => setScreen({ name: 'login' })} />
  }

  if (screen.name === 'login') {
    return (
      <LogIn
        onSubmit={logIn}
        initialError={expiredLink ? messages.linkExpired : null}
        onSignUp={() => setScreen({ name: 'signup' })}
        onForgotPassword={(email) => setScreen({ name: 'forgot', email })}
      />
    )
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
