import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../components/basics/Button'
import { PasswordInput, TextInput } from '../components/basics/TextInput'
import { Logo } from '../components/brand/Logo'
import welcomeCatDog from '../assets/welcome-cat-dog.webp'

/**
 * Sign up — Figma ONBOARDING › "Sign up" (85:10546), the first screen of the app.
 *
 * What it does
 *   - Email, password (with show/hide) and an invitation code.
 *   - Checks the fields when "Create profile" is tapped, then re-checks as you fix them.
 *   - An invite link like homami.app/?invite=LUNA42 fills in the code for you.
 *   - Hands the details to `onSubmit`. Creating the real account is wired up later,
 *     once the database is in place; until then the app just moves on.
 */
export interface SignUpValues {
  email: string
  password: string
  inviteCode: string
}

export interface SignUpProps {
  /** Called with the details once they pass the checks. Throw an Error to show its message on the form. */
  onSubmit?: (values: SignUpValues) => Promise<void> | void
  /** Pre-fills the invitation code, e.g. from an invite link */
  initialInviteCode?: string
}

export const MIN_PASSWORD = 8

type Errors = Partial<Record<'email' | 'password', string>>

export function checkSignUp({ email, password }: SignUpValues): Errors {
  const errors: Errors = {}
  const trimmed = email.trim()
  if (!trimmed) errors.email = 'Add your email'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) errors.email = 'This email doesn’t look right. Try name@example.com'
  if (!password) errors.password = 'Add a password'
  else if (password.length < MIN_PASSWORD) errors.password = `Use at least ${MIN_PASSWORD} characters`
  return errors
}

export function SignUp({ onSubmit, initialInviteCode = '' }: SignUpProps) {
  const [values, setValues] = useState<SignUpValues>({ email: '', password: '', inviteCode: initialInviteCode })
  const [triedOnce, setTriedOnce] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const errors = triedOnce ? checkSignUp(values) : {}
  const set = (key: keyof SignUpValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }))
    setFormError(null)
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setTriedOnce(true)
    const found = checkSignUp(values)
    if (Object.keys(found).length) {
      // put the cursor in the first field that needs fixing
      const first = found.email ? 'signup-email' : 'signup-password'
      document.getElementById(first)?.focus()
      return
    }
    setSubmitting(true)
    try {
      await onSubmit?.({ ...values, email: values.email.trim(), inviteCode: values.inviteCode.trim() })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col overflow-x-clip bg-surface">
      <div className="flex flex-col items-center gap-xl px-l pt-[min(104px,12dvh)] pb-m">
        <Logo />
        <div className="flex flex-col items-center gap-xl text-center">
          <h1 className="text-[28px] leading-[1.2] font-medium text-dark-sage">Welcome</h1>
          <p className="text-body text-medium-grey">Build your trusted circle for pet care</p>
        </div>

        <form noValidate onSubmit={handleSubmit} className="flex w-full flex-col items-center gap-xl">
          <div className="flex w-full flex-col gap-xl">
            <TextInput
              id="signup-email"
              label="Email"
              hideLabel
              placeholder="Email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={values.email}
              onChange={set('email')}
              error={errors.email}
            />
            <PasswordInput
              id="signup-password"
              label="Password"
              hideLabel
              placeholder="Password"
              autoComplete="new-password"
              value={values.password}
              onChange={set('password')}
              error={errors.password}
              helper={errors.password ? undefined : `At least ${MIN_PASSWORD} characters`}
            />
            <TextInput
              id="signup-invite"
              label="Invitation code"
              hideLabel
              placeholder="Invitation Code"
              autoComplete="off"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              value={values.inviteCode}
              onChange={set('inviteCode')}
            />
          </div>

          {formError && (
            <p role="alert" className="w-full text-label text-error">
              {formError}
            </p>
          )}

          <Button type="submit" variant="neutral" disabled={submitting} aria-busy={submitting || undefined}>
            {submitting ? 'Creating profile…' : 'Create profile'}
          </Button>
        </form>
      </div>

      {/* Cat and dog: 120% of the screen width, sitting on the bottom edge and cropped like in Figma */}
      <div aria-hidden className="relative mt-auto aspect-[393/305] w-full shrink-0 overflow-hidden">
        <img
          src={welcomeCatDog}
          alt=""
          width={944}
          height={737}
          className="absolute top-0 left-[-9.16%] w-[120.1%] max-w-none select-none"
          draggable={false}
        />
      </div>
    </main>
  )
}
