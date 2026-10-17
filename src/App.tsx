import { useState } from 'react'
import { SignUp } from './screens/SignUp'
import type { SignUpValues } from './screens/SignUp'
import { Button } from './components/basics/Button'

/** An invite link looks like https://…/?invite=LUNA42 — the code is filled in for the person. */
function inviteFromLink() {
  return new URLSearchParams(window.location.search).get('invite') ?? ''
}

export default function App() {
  const [account, setAccount] = useState<SignUpValues | null>(null)

  if (!account) {
    return <SignUp initialInviteCode={inviteFromLink()} onSubmit={(values) => setAccount(values)} />
  }

  // Temporary stand-in until "Set up your profile" is built and accounts are saved for real.
  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center gap-xl px-l text-center">
      <h1 className="text-title-large text-dark-sage">Nice to meet you</h1>
      <p className="text-body text-medium-grey">
        {account.email} is ready to go. Setting up your profile is the next screen we build.
      </p>
      <Button variant="outline" onClick={() => setAccount(null)}>
        Back to sign up
      </Button>
    </main>
  )
}
