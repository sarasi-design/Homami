import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Button } from '../components/basics/Button'
import { PasswordInput, TextInput } from '../components/basics/TextInput'
import { checkEmail, checkInviteCode, checkNewPassword, focusFirst, MIN_PASSWORD } from './authChecks'
import { FormError, SwitchLink, WelcomeLayout } from './WelcomeLayout'

/**
 * Sign up — Figma ONBOARDING › "Sign up" (85:10546), the first screen of the app.
 *
 *   - Email, password (with show/hide) and an invitation code. Homami is invite-only for now,
 *     so the code is required.
 *   - Checks the fields when "Create profile" is tapped, then re-checks as you fix them.
 *   - An invite link like …/?invite=LUNA42 fills in the code for you.
 *   - Hands the details to `onSubmit`; throw an Error there to show its message on the form.
 */
export interface SignUpValues {
  email: string
  password: string
  inviteCode: string
}

export interface SignUpProps {
  onSubmit?: (values: SignUpValues) => Promise<void> | void
  /** "Already have an account? Log in" */
  onLogIn?: () => void
  /** Pre-fills the invitation code, e.g. from an invite link */
  initialInviteCode?: string
}

const fieldIds = { email: 'signup-email', password: 'signup-password', inviteCode: 'signup-invite' }

function check(v: SignUpValues) {
  return { email: checkEmail(v.email), password: checkNewPassword(v.password), inviteCode: checkInviteCode(v.inviteCode) }
}

export function SignUp({ onSubmit, onLogIn, initialInviteCode = '' }: SignUpProps) {
  const [values, setValues] = useState<SignUpValues>({ email: '', password: '', inviteCode: initialInviteCode })
  const [triedOnce, setTriedOnce] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const errors: ReturnType<typeof check> | Record<string, undefined> = triedOnce ? check(values) : {}
  const set = (key: keyof SignUpValues) => (e: ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }))
    setFormError(null)
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setTriedOnce(true)
    const found = check(values)
    if (Object.values(found).some(Boolean)) return focusFirst(found, fieldIds)
    setSubmitting(true)
    try {
      await onSubmit?.({ ...values, email: values.email.trim(), inviteCode: values.inviteCode.trim().toUpperCase() })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <WelcomeLayout title="Welcome" subtitle="Build your trusted circle for pet care">
      <form noValidate onSubmit={handleSubmit} className="flex w-full flex-col items-center gap-xl">
        <div className="flex w-full flex-col gap-xl">
          <TextInput
            id={fieldIds.email}
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
            id={fieldIds.password}
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
            id={fieldIds.inviteCode}
            label="Invitation code"
            hideLabel
            placeholder="Invitation Code"
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            value={values.inviteCode}
            onChange={set('inviteCode')}
            error={errors.inviteCode}
          />
        </div>

        {formError && <FormError>{formError}</FormError>}

        <div className="flex flex-col items-center gap-s">
          <Button type="submit" variant="neutral" disabled={submitting} aria-busy={submitting || undefined}>
            {submitting ? 'Creating profile…' : 'Create profile'}
          </Button>
          <SwitchLink question="Already have an account?" action="Log in" onClick={onLogIn} />
        </div>
      </form>
    </WelcomeLayout>
  )
}
