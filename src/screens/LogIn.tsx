import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Button } from '../components/basics/Button'
import { PasswordInput, TextInput } from '../components/basics/TextInput'
import { TextLink } from '../components/basics/TextLink'
import { checkEmail, focusFirst } from './authChecks'
import { FormError, SwitchLink, WelcomeLayout } from './WelcomeLayout'

/**
 * Log in — for people who already have an account. Not in Figma yet: built from the
 * Sign up screen's parts (same layout, fields and button) so it can be designed over later.
 */
export interface LogInValues {
  email: string
  password: string
}

export interface LogInProps {
  onSubmit?: (values: LogInValues) => Promise<void> | void
  /** "Got an invitation? Create a profile" */
  onSignUp?: () => void
  /** "Forgot your password?" — gets whatever email was typed, to fill it in on the next screen */
  onForgotPassword?: (email: string) => void
  /** A message to show straight away, e.g. when an email link has expired */
  initialError?: string | null
}

const fieldIds = { email: 'login-email', password: 'login-password' }

function check(v: LogInValues) {
  return { email: checkEmail(v.email), password: v.password ? undefined : 'Add your password' }
}

export function LogIn({ onSubmit, onSignUp, onForgotPassword, initialError = null }: LogInProps) {
  const [values, setValues] = useState<LogInValues>({ email: '', password: '' })
  const [triedOnce, setTriedOnce] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(initialError)

  const errors: ReturnType<typeof check> | Record<string, undefined> = triedOnce ? check(values) : {}
  const set = (key: keyof LogInValues) => (e: ChangeEvent<HTMLInputElement>) => {
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
      await onSubmit?.({ ...values, email: values.email.trim() })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <WelcomeLayout title="Welcome back" subtitle="Log in to see your circle">
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
            autoComplete="current-password"
            value={values.password}
            onChange={set('password')}
            error={errors.password}
          />
          {onForgotPassword && (
            <p className="-mt-l -mb-s flex justify-end">
              <TextLink onClick={() => onForgotPassword(values.email.trim())}>Forgot your password?</TextLink>
            </p>
          )}
        </div>

        {formError && <FormError>{formError}</FormError>}

        <div className="flex flex-col items-center gap-s">
          <Button type="submit" variant="neutral" disabled={submitting} aria-busy={submitting || undefined}>
            {submitting ? 'Logging in…' : 'Log in'}
          </Button>
          <SwitchLink question="Got an invitation?" action="Create a profile" onClick={onSignUp} />
        </div>
      </form>
    </WelcomeLayout>
  )
}
