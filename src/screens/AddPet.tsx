import { useState } from 'react'
import type { FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '../components/basics/Button'
import { TextArea, TextInput } from '../components/basics/TextInput'
import { Header } from '../components/blocks/Header'
import { PhotoPicker } from '../components/blocks/PhotoPicker'
import { ConfirmAction } from '../components/blocks/ConfirmAction'
import { FormError } from './WelcomeLayout'
import type { PetKind } from './PetType'

/**
 * Add your pet — Figma ONBOARDING (90:6293): photo, name, age and a short description.
 * Only the name is needed. "Save pet" hands everything to `onSubmit`.
 *
 * Edit pet (not in Figma): the same form filled in with `initial`, reached by tapping a pet on
 * Your profile. "Save" instead of "Save pet", plus "Remove pet" (asks to confirm) when `onRemove` is set.
 */
export interface PetValues {
  kind: PetKind
  name: string
  age: string
  description: string
  photo: File | null
}

export interface AddPetProps {
  /** Header title: 'Set up profile' during sign-up, 'Add a pet' from Your profile */
  title?: string
  kind: PetKind
  onSubmit?: (values: PetValues) => Promise<void> | void
  onBack?: () => void
  /** Edit pet: what's saved now */
  initial?: { name: string; age?: string | null; description?: string | null; photoUrl?: string | null }
  /** Edit pet: shows "Remove pet" at the bottom */
  onRemove?: () => Promise<void> | void
}

export function AddPet({ kind, onSubmit, onBack, title = 'Set up profile', initial, onRemove }: AddPetProps) {
  const editing = !!initial
  const [name, setName] = useState(initial?.name ?? '')
  const [age, setAge] = useState(initial?.age ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
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
      <Header title={title} onBack={onBack} />
      <form noValidate onSubmit={handleSubmit} className="flex flex-1 flex-col gap-xl px-l pt-xl pb-[40px]">
        {!editing && <h2 className="text-overline text-dark-grey">Tell us about your pet</h2>}

        <div className="flex flex-col gap-xl">
          <PhotoPicker
            label={`${kind === 'dog' ? 'Dog' : 'Cat'} picture`}
            subject="pet"
            title={photo || initial?.photoUrl ? 'So cute!' : 'Add a picture of your pet'}
            hint={photo || initial?.photoUrl ? 'Tap the photo to choose a different one.' : 'Can’t wait to see how cute they are!'}
            file={photo}
            currentUrl={initial?.photoUrl}
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

        <div className="mt-auto flex flex-col items-center gap-m pt-xl">
          <Button type="submit" variant="neutral" disabled={submitting} aria-busy={submitting || undefined}>
            {submitting ? 'Saving…' : editing ? 'Save' : 'Save pet'}
          </Button>
          {onRemove && (
            <ConfirmAction
              size="small"
              label="Remove pet"
              icon={Trash2}
              confirmLabel={`Yes, remove ${initial?.name ?? 'pet'}`}
              busyLabel="Removing…"
              onConfirm={async () => {
                setFormError(null)
                try {
                  await onRemove()
                } catch (err) {
                  setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
                }
              }}
            />
          )}
        </div>
      </form>
    </main>
  )
}
