import { Suspense, lazy, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { SignUp } from './screens/SignUp'
import { LogIn } from './screens/LogIn'
import { WelcomeLayout } from './screens/WelcomeLayout'
import { ForgotPassword, NewPassword, ResetLinkSent } from './screens/PasswordReset'
import { Button } from './components/basics/Button'
import { supabase } from './lib/supabase'
import { logIn, messages, sendPasswordReset, setNewPassword, signUp } from './lib/auth'
import { inviteFromLink } from './lib/inviteLink'
import { SitterPublicPage } from './screens/SitterPublicPage'
import { getPublicSitterPage, rememberSitterLink, sitterCodeFromLink } from './lib/recommendations'
import type { LinkIntent, PublicSitterPage } from './lib/recommendations'
// The app itself loads once you're logged in, so Sign up and Log in open quickly
const LoggedIn = lazy(() => import('./LoggedIn').then((m) => ({ default: m.LoggedIn })))

/**
 * Opened from a "choose a new password" email? Read it now, before Supabase tidies the link away.
 * (Supabase also announces it with a PASSWORD_RECOVERY event, listened to below.)
 */
const openedFromResetLink = window.location.hash.includes('type=recovery')

/** An old or already-used email link comes back as #error=…: say so on Log in, and tidy the address. */
const expiredLink = /error_code=otp_expired|error=access_denied/.test(window.location.hash)
if (expiredLink) window.history.replaceState(null, '', window.location.pathname + window.location.search)

/** Opened a pet sitter's link (…/?sitter=CODE): their public page comes first (database script 20) */
const sitterCode = sitterCodeFromLink()

type Screen =
  | { name: 'sitter' }
  | { name: 'signup'; fromSitter?: LinkIntent }
  | { name: 'login' }
  | { name: 'check-email'; email: string }
  | { name: 'forgot'; email: string }
  | { name: 'reset-sent'; email: string }

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined) // undefined = still checking
  const [screen, setScreen] = useState<Screen>(expiredLink ? { name: 'login' } : sitterCode ? { name: 'sitter' } : { name: 'signup' })
  const [sitterPage, setSitterPage] = useState<PublicSitterPage | null | undefined>(undefined)
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

  // A pet sitter's public page, for anyone with their link
  useEffect(() => {
    if (!sitterCode) return
    getPublicSitterPage(sitterCode)
      .then(setSitterPage)
      .catch(() => setSitterPage(null))
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
    return (
      <Suspense fallback={null}>
        <LoggedIn key={session.user.id} session={session} onLoggedOut={() => setScreen({ name: 'login' })} />
      </Suspense>
    )
  }

  if (screen.name === 'sitter' && sitterCode) {
    // Contact or recommend: sign up (no code needed), then Homami takes you back to this sitter
    const goSignUp = (intent: LinkIntent) => {
      rememberSitterLink({ code: sitterCode, intent })
      setScreen({ name: 'signup', fromSitter: intent })
    }
    return (
      <SitterPublicPage
        page={sitterPage}
        onContact={() => goSignUp('contact')}
        onRecommend={() => goSignUp('recommend')}
        onLogIn={() => {
          rememberSitterLink({ code: sitterCode, intent: 'look' })
          setScreen({ name: 'login' })
        }}
      />
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

  const fromSitter = screen.name === 'signup' ? screen.fromSitter : undefined
  const sitterName = sitterPage?.first_name ?? 'this sitter'
  return (
    <SignUp
      initialInviteCode={fromSitter ? '' : (inviteFromLink() ?? '')}
      fromSitter={
        fromSitter && {
          title: fromSitter === 'recommend' ? `Sign up to recommend ${sitterName}` : `Sign up to contact ${sitterName}`,
          onBack: () => setScreen({ name: 'sitter' }),
        }
      }
      onSubmit={async (values) => {
        // From a sitter's link: the email's confirmation link brings you back to them
        const result = await signUp(values, fromSitter && sitterCode ? `/?sitter=${sitterCode}&do=${fromSitter}` : '')
        if (result.status === 'check-email') setScreen({ name: 'check-email', email: result.email })
      }}
      onLogIn={() => setScreen({ name: 'login' })}
    />
  )
}
