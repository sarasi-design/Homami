import { useState } from 'react'
import { ThumbsUp, Trash2 } from 'lucide-react'
import { Button } from '../components/basics/Button'
import { Avatar } from '../components/basics/Avatar'
import { Note } from '../components/basics/Note'
import { TextArea } from '../components/basics/TextInput'
import { ConfirmAction } from '../components/blocks/ConfirmAction'
import { Header } from '../components/blocks/Header'
import { PetPicker } from '../components/blocks/PetPicker'
import { FormError } from './WelcomeLayout'
import { NOTE_MAX } from '../lib/recommendations'
import type { MyRecommendation, RecommendationValues } from '../lib/recommendations'

/**
 * Recommend a pet sitter — the "Endorse" step of Figma Chat+book (140:6880; Sara, Nov 15, 2026, database script 20).
 * Figma has the step but no screen, so it's built like Review a sitter, on one page:
 *   the sitter · Which pets did Daniel look after? (optional, your pets) · A short note (optional, 300 characters)
 *   · "Your name and photo will be shown on Daniel's page." · Recommend Daniel.
 * Anyone who has used them can recommend them, through Homami or not. Editing shows what you said before and
 * "Take back recommendation".
 */
export interface RecommendSitterProps {
  sitterName: string
  sitterPhotoUrl?: string | null
  /** Your own pets, to say which ones they looked after */
  pets: { id: string; name: string; photoUrl?: string | null }[]
  /** Your recommendation from before, when editing */
  initial?: MyRecommendation | null
  /** The sitter's profile isn't available (they stopped offering pet sitting, or it's you) */
  unavailable?: string | null
  onSubmit: (values: RecommendationValues) => Promise<void>
  onRemove?: () => Promise<void>
  onBack: () => void
}

export function RecommendSitter({ sitterName, sitterPhotoUrl, pets, initial, unavailable, onSubmit, onRemove, onBack }: RecommendSitterProps) {
  const [petIds, setPetIds] = useState<string[]>(initial?.pet_ids.filter((id) => pets.some((p) => p.id === id)) ?? [])
  const [note, setNote] = useState(initial?.note ?? '')
  const [sending, setSending] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function send() {
    setSending(true)
    setFormError(null)
    try {
      await onSubmit({ petIds, note: note.trim() })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setSending(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
      <Header title={initial ? 'Your recommendation' : `Recommend ${sitterName}`} onBack={onBack} />
      <div className="flex flex-1 flex-col gap-xl px-l pt-s pb-[40px]">
        <div className="flex items-center gap-m">
          <Avatar size="medium" name={sitterName} src={sitterPhotoUrl ?? undefined} />
          <div className="flex flex-col">
            <p className="text-body-bold text-dark-grey">{sitterName}</p>
            <p className="text-caption text-medium-grey">Pet sitter</p>
          </div>
        </div>

        {unavailable ? (
          <Note title="You can’t recommend them here">{unavailable}</Note>
        ) : (
          <>
            <p className="text-label-light text-dark-grey">
              Has {sitterName} looked after your pets? Tell your friends. Through Homami or not, it all counts.
            </p>

            {pets.length > 0 && (
              <section className="flex flex-col gap-m">
                <h2 className="text-overline text-dark-grey">Which pets did {sitterName} look after?</h2>
                <PetPicker multiple label={`Pets ${sitterName} looked after`} pets={pets} values={petIds} onChangeMany={setPetIds} />
                <p className="text-caption text-medium-grey">Optional. Only members see your pets’ names.</p>
              </section>
            )}

            <section className="flex flex-col gap-m">
              <h2 className="text-overline text-dark-grey">A short note</h2>
              <TextArea
                label="A short note"
                hideLabel
                placeholder={`Optional. For example: Looked after Luna and Milo for 3 weeks in August`}
                maxLength={NOTE_MAX}
                showCount
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </section>

            <Note>Your name and photo will be shown on {sitterName}’s page, which anyone with the link can see.</Note>

            {formError && <FormError>{formError}</FormError>}

            <div className="flex flex-col gap-s">
              <Button variant="neutral" fullWidth iconLeft={ThumbsUp} onClick={send} disabled={sending} aria-busy={sending || undefined}>
                {sending ? 'Saving…' : initial ? 'Save recommendation' : `Recommend ${sitterName}`}
              </Button>
              {initial && onRemove && (
                <div className="flex justify-center">
                  <ConfirmAction
                    icon={Trash2}
                    label="Take back recommendation"
                    confirmLabel="Yes, take it back"
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
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
