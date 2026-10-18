import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../components/basics/Button'
import { PasswordInput, TextInput } from '../components/basics/TextInput'
import { MIN_PASSWORD, checkEmail, checkNewPassword } from './authChecks'
import { FormError, SwitchLink, WelcomeLayout } from './WelcomeLayout'

/**
 * Forgot your password — not in Figma yet; built from the Log in screen's parts.
 *   1. ForgotPassword: type your email, we send a link.
 *   2. ResetLinkSent: "Check your inbox".
 *   3. NewPassword: the link opens Homami here; choose a new password and you're in.
 */

export interface ForgotPasswordProps {
  /** Whatever was already typed on Log in */
  initialEmail?: string
  onSubmit?: (email: string) => Promise<void> | void
  onBack?: () => void
}

export function ForgotPassword({ initialEmail = '', onSubmit, onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState(initialEmail)
  const [triedOnce, setTriedOnce] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const emailError = triedOnce ? checkEmail(email) : undefined

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setTriedOnce(true)
    if (checkEmail(email)) return document.getElementById('reset-email')?.focus()
    setSubmitting(true)
    try {
      await onSubmit?.(email.trim())
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <WelcomeLayout title="Forgot your password?" subtitle="No problem. We’ll email you a link to choose a new one.">
      <form noValidate onSubmit={handleSubmit} className="flex w-full flex-col items-center gap-xl">
        <div className="flex w-full flex-col gap-xl">
          <TextInput
            id="reset-email"
            label="Email"
            hideLabel
            placeholder="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setFormError(null)
            }}
            error={emailError}
          />
        </div>

        {formError && <FormError>{formError}</FormError>}

        <div className="flex flex-col items-center gap-s">
          <Button type="submit" variant="neutral" disabled={submitting} aria-busy={submitting || undefined}>
            {submitting ? 'Sending…' : 'Send link'}
          </Button>
          <SwitchLink question="Remembered it?" action="Log in" onClick={onBack} />
        </div>
      </form>
    </WelcomeLayout>
  )
}

export function ResetLinkSent({ email, onBack }: { email: string; onBack?: () => void }) {
  return (
    <WelcomeLayout
      title="Check your inbox"
      subtitle={`If there’s a profile for ${email}, we’ve sent it a link to choose a new password. It can take a minute or two.`}
    >
      <Button variant="outline" onClick={onBack}>
        Back to log in
      </Button>
    </WelcomeLayout>
  )
}

export interface NewPasswordProps {
  onSubmit?: (password: string) => Promise<void> | void
}

export function NewPassword({ onSubmit }: NewPasswordProps) {
  const [password, setPassword] = useState('')
  const [triedOnce, setTriedOnce] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const passwordError = triedOnce ? checkNewPassword(password) : undefined

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setTriedOnce(true)
    if (checkNewPassword(password)) return document.getElementById('new-password')?.focus()
    setSubmitting(true)
    try {
      await onSubmit?.(password)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <WelcomeLayout title="Choose a new password" subtitle="You’ll use it to log in from now on.">
      <form noValidate onSubmit={handleSubmit} className="flex w-full flex-col items-center gap-xl">
        <div className="flex w-full flex-col gap-xl">
          <PasswordInput
            id="new-password"
            label="New password"
            hideLabel
            placeholder="New password"
            autoComplete="new-password"
            helper={`At least ${MIN_PASSWORD} characters`}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setFormError(null)
            }}
            error={passwordError}
          />
        </div>

        {formError && <FormError>{formError}</FormError>}

        <Button type="submit" variant="neutral" disabled={submitting} aria-busy={submitting || undefined}>
          {submitting ? 'Saving…' : 'Save password'}
        </Button>
      </form>
    </WelcomeLayout>
  )
}
