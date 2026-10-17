import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../components/basics/Button'
import { TextArea, TextInput } from '../components/basics/TextInput'
import { Header } from '../components/blocks/Header'
import { PhotoPicker } from '../components/blocks/PhotoPicker'
import { FormError } from './WelcomeLayout'
import type { PetKind } from './PetType'

/**
 * Add your pet — Figma ONBOARDING (90:6293): photo, name, age and a short description.
 * Only the name is needed. "Save pet" hands everything to `onSubmit`.
 */
export interface PetValues {
  kind: PetKind
  name: string
  age: string
  description: string
  photo: File | null
}

export interface AddPetProps {
  kind: PetKind
  onSubmit?: (values: PetValues) => Promise<void> | void
  onBack?: () => void
}

export function AddPet({ kind, onSubmit, onBack }: AddPetProps) {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [triedOnce, setTriedOnce] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const nameError = triedOnce && !name.trim() ? `Add your ${kind}’s name` : undefined

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setTriedOnce(true)
    if (!name.trim()) return document.getElementById('pet-name')?.focus()
    setSubmitting(true)
    setFormError(null)
    try {
      await onSubmit?.({ kind, name: name.trim(), age: age.trim(), description: description.trim(), photo })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
      <Header title="Set up profile" onBack={onBack} />
      <form noValidate onSubmit={handleSubmit} className="flex flex-1 flex-col gap-xl px-l pt-xl pb-[40px]">
        <h2 className="text-overline text-dark-grey">Tell us about your pet</h2>

        <div className="flex flex-col gap-xl">
          <PhotoPicker
            label={`${kind === 'dog' ? 'Dog' : 'Cat'} picture`}
            emptyStyle="camera"
            title={photo ? 'So cute!' : 'Add a picture of your pet'}
            hint={photo ? 'Tap the photo to choose a different one.' : 'Can’t wait to see how cute they are!'}
            file={photo}
            onChange={(f) => {
              setPhoto(f)
              setFormError(null)
            }}
          />
          <TextInput
            id="pet-name"
            label="Pet’s name"
            hideLabel
            placeholder="Pet’s name"
            autoCapitalize="words"
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={nameError}
          />
          <TextInput
            id="pet-age"
            label="Pet’s age"
            hideLabel
            placeholder="Pet’s age"
            helper="For example 3, or 4 months"
            maxLength={30}
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
          <TextArea
            id="pet-description"
            label="About your pet"
            hideLabel
            placeholder="Add a short description of your pet’s personality and if they need any type of special care"
            maxLength={300}
            showCount
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {formError && <FormError>{formError}</FormError>}

        <div className="mt-auto flex justify-center pt-xl">
          <Button type="submit" variant="neutral" disabled={submitting} aria-busy={submitting || undefined}>
            {submitting ? 'Saving…' : 'Save pet'}
          </Button>
        </div>
      </form>
    </main>
  )
}
