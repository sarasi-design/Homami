import { useState } from 'react'
import type { FormEvent } from 'react'
import { X } from 'lucide-react'
import { Button, IconButton } from '../components/basics/Button'
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
 * variant="sheet": shown in a Sheet over the wall (tap "What's new?"): a title with a close button,
 * and the text box first and focused, so it feels like the field opened up.
 */
export interface NewPostProps {
  pets: { id: string; name: string; photoUrl?: string | null }[]
  onSubmit?: (values: NewPostValues) => Promise<void> | void
  onBack: () => void
  variant?: 'page' | 'sheet'
}

export function NewPost({ pets, onSubmit, onBack, variant = 'page' }: NewPostProps) {
  const inSheet = variant === 'sheet'
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

  const text = (
    <TextArea
      id="post-body"
      label="What’s new?"
      hideLabel
      placeholder={petName ? `What’s new with ${petName}?` : 'What’s new?'}
      maxLength={500}
      showCount
      rows={inSheet ? 5 : 4}
      autoFocus={inSheet}
      value={body}
      onChange={(e) => { setBody(e.target.value); setFormError(null) }}
    />
  )
  const picker = pets.length > 0 && (
    <section className="flex flex-col gap-m">
      <h2 className="text-overline text-dark-grey">Who is it about?</h2>
      <PetPicker label="Who is it about?" pets={pets} value={petId} onChange={setPetId} />
    </section>
  )
  const photoField = <PhotoField file={photo} onChange={(f) => { setPhoto(f); setFormError(null) }} />

  const form = (
    <form noValidate onSubmit={handleSubmit} className={inSheet ? 'flex flex-col gap-xl px-l pt-s pb-xl' : 'flex flex-1 flex-col gap-xl px-l pt-s pb-[40px]'}>
      {inSheet ? (
        <>
          {text}
          {picker}
          {photoField}
        </>
      ) : (
        <>
          {picker}
          {photoField}
          {text}
        </>
      )}
      {formError && <FormError>{formError}</FormError>}
      <div className={inSheet ? 'flex justify-center pt-s' : 'mt-auto flex justify-center pt-xl'}>
        <Button type="submit" variant="neutral" disabled={submitting} aria-busy={submitting || undefined}>
          {submitting ? 'Posting…' : 'Post to my circle'}
        </Button>
      </div>
    </form>
  )

  if (inSheet) {
    return (
      <>
        <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-l pt-l pb-s">
          <h1 className="text-title text-dark-sage">New post</h1>
          <IconButton icon={X} label="Close" onClick={onBack} />
        </div>
        {form}
      </>
    )
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
      <Header title="New post" onBack={onBack} backLabel="Cancel" />
      {form}
    </main>
  )
}
