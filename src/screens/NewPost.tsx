import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../components/basics/Button'
import { TextArea } from '../components/basics/TextInput'
import { Header } from '../components/blocks/Header'
import { PetPicker } from '../components/blocks/PetPicker'
import { PhotoField } from '../components/blocks/PhotoField'
import { FormError } from './WelcomeLayout'
import type { NewPost as NewPostValues } from '../lib/posts'

/**
 * New post — share an update with your circle. Not in Figma yet; built from design-system parts:
 * Header, PetPicker (which pet it's about), PhotoField, TextArea and the main Button.
 * A post needs some text or a photo.
 */
export interface NewPostProps {
  pets: { id: string; name: string; photoUrl?: string | null }[]
  onSubmit?: (values: NewPostValues) => Promise<void> | void
  onBack: () => void
}

export function NewPost({ pets, onSubmit, onBack }: NewPostProps) {
  const [petId, setPetId] = useState<string | null>(pets.length === 1 ? pets[0].id : null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const petName = pets.find((p) => p.id === petId)?.name
  const empty = !body.trim() && !photo

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (empty) return setFormError('Add a photo or a few words first')
    setSubmitting(true)
    setFormError(null)
    try {
      await onSubmit?.({ body: body.trim(), petId, photo })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
      <Header title="New post" onBack={onBack} backLabel="Cancel" />
      <form noValidate onSubmit={handleSubmit} className="flex flex-1 flex-col gap-xl px-l pt-s pb-[40px]">
        {pets.length > 0 && (
          <section className="flex flex-col gap-m">
            <h2 className="text-overline text-dark-grey">Who is it about?</h2>
            <PetPicker label="Who is it about?" pets={pets} value={petId} onChange={setPetId} />
          </section>
        )}
        <PhotoField file={photo} onChange={(f) => { setPhoto(f); setFormError(null) }} />
        <TextArea
          id="post-body"
          label="What’s new?"
          hideLabel
          placeholder={petName ? `What’s new with ${petName}?` : 'What’s new with your pets?'}
          maxLength={500}
          showCount
          rows={4}
          value={body}
          onChange={(e) => { setBody(e.target.value); setFormError(null) }}
        />
        {formError && <FormError>{formError}</FormError>}
        <div className="mt-auto flex justify-center pt-xl">
          <Button type="submit" variant="neutral" disabled={submitting} aria-busy={submitting || undefined}>
            {submitting ? 'Posting…' : 'Post to my circle'}
          </Button>
        </div>
      </form>
    </main>
  )
}
