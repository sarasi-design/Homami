import { useState } from 'react'
import { SignUp } from './screens/SignUp'
import { LogIn } from './screens/LogIn'
import { Button } from './components/basics/Button'

/** An invite link looks like https://…/?invite=LUNA42 — the code is filled in for the person. */
function inviteFromLink() {
  return new URLSearchParams(window.location.search).get('invite') ?? ''
}

type Screen = { name: 'signup' } | { name: 'login' } | { name: 'in'; email: string; isNew: boolean }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'signup' })

  if (screen.name === 'signup') {
    return (
      <SignUp
        initialInviteCode={inviteFromLink()}
        onSubmit={({ email }) => setScreen({ name: 'in', email, isNew: true })}
        onLogIn={() => setScreen({ name: 'login' })}
      />
    )
  }
  if (screen.name === 'login') {
    return (
      <LogIn
        onSubmit={({ email }) => setScreen({ name: 'in', email, isNew: false })}
        onSignUp={() => setScreen({ name: 'signup' })}
      />
    )
  }

  // Temporary stand-in until accounts are saved for real (Supabase) and the profile screens exist.
  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center gap-xl px-l text-center">
      <h1 className="text-title-large text-dark-sage">{screen.isNew ? 'Nice to meet you' : 'Welcome back'}</h1>
      <p className="text-body text-medium-grey">
        {screen.email} is ready to go. Setting up your profile is the next screen we build.
      </p>
      <Button variant="outline" onClick={() => setScreen({ name: 'signup' })}>
        Back to start
      </Button>
    </main>
  )
}
