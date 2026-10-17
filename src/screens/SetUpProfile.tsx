import { useState } from 'react'
import type { FormEvent } from 'react'
import { MapPin } from 'lucide-react'
import { Button } from '../components/basics/Button'
import { TextInput } from '../components/basics/TextInput'
import { PhotoPicker } from '../components/blocks/PhotoPicker'
import { FormError } from './WelcomeLayout'

/**
 * Set up your profile — Figma ONBOARDING › "Let's set up your profile" (85:10570).
 * Shown right after someone joins, until they've added their first name.
 *
 *   - Photo (optional), first name (needed), city (optional).
 *   - "Next" hands everything to `onSubmit`; throw an Error there to show its message.
 */
export interface ProfileValues {
  firstName: string
  city: string
  photo: File | null
}

export interface SetUpProfileProps {
  onSubmit?: (values: ProfileValues) => Promise<void> | void
  /** Anything already saved, e.g. if they come back to this screen */
  initial?: { firstName?: string | null; city?: string | null; avatarUrl?: string | null }
}

export function SetUpProfile({ onSubmit, initial }: SetUpProfileProps) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? '')
  const [city, setCity] = useState(initial?.city ?? '')
  const [photo, setPhoto] = useState<File | null>(null)
  const [triedOnce, setTriedOnce] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const nameError = triedOnce && !firstName.trim() ? 'Add your first name so your circle knows who you are' : undefined

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setTriedOnce(true)
    if (!firstName.trim()) return document.getElementById('profile-first-name')?.focus()
    setSubmitting(true)
    setFormError(null)
    try {
      await onSubmit?.({ firstName: firstName.trim(), city: city.trim(), photo })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
      <form noValidate onSubmit={handleSubmit} className="flex flex-1 flex-col gap-xl px-l pt-[min(104px,12dvh)] pb-[40px]">
        <h1 className="text-title font-medium text-dark-sage">Let’s set up your profile</h1>

        <div className="flex flex-col gap-xl">
          <PhotoPicker
            label="Profile picture"
            title={photo || initial?.avatarUrl ? 'Looking good!' : 'Add a profile picture'}
            hint={
              photo || initial?.avatarUrl
                ? 'Tap the photo to choose a different one.'
                : 'It’s optional, but it helps the people in your circle recognise you.'
            }
            file={photo}
            currentUrl={initial?.avatarUrl}
            onChange={(f) => {
              setPhoto(f)
              setFormError(null)
            }}
          />
          <TextInput
            id="profile-first-name"
            label="First name"
            hideLabel
            placeholder="Add your first name"
            autoComplete="given-name"
            autoCapitalize="words"
            maxLength={40}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            error={nameError}
          />
          <TextInput
            id="profile-city"
            label="City"
            hideLabel
            placeholder="Add your city"
            autoComplete="address-level2"
            autoCapitalize="words"
            maxLength={60}
            icon={MapPin}
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>

        {formError && <FormError>{formError}</FormError>}

        <div className="mt-auto flex justify-center pt-xl">
          <Button type="submit" variant="neutral" disabled={submitting} aria-busy={submitting || undefined}>
            {submitting ? 'Saving…' : 'Next'}
          </Button>
        </div>
      </form>
    </main>
  )
}
