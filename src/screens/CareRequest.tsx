import { useState } from 'react'
import { Check, MapPin, Trash2 } from 'lucide-react'
import { Button } from '../components/basics/Button'
import { SelectableTag } from '../components/basics/SelectableTag'
import { TextInput } from '../components/basics/TextInput'
import { Header } from '../components/blocks/Header'
import { MonthCalendar } from '../components/blocks/MonthCalendar'
import { PetPicker } from '../components/blocks/PetPicker'
import { RequestCard } from '../components/blocks/RequestCard'
import { ConfirmAction } from '../components/blocks/ConfirmAction'
import type { PetSummary } from '../components/blocks/PetsSection'
import { FormError } from './WelcomeLayout'
import { OFFERS } from '../lib/sitters'
import type { OfferId } from '../lib/sitters'
import { dateRangeLabel } from '../lib/requests'
import type { CareRequestValues } from '../lib/requests'

/**
 * Create a request — Figma ONBOARDING "USER NEEDS PET SITTING" (85:10640 → 85:10889).
 * Like Set up pet sitter profile, the steps sit on one scrolling page —
 * What you need · When · Where · Who do you need care for? — then "Preview request" shows the
 * request as others will see it, with "Publish request".
 *   new:  from the "Need help with your pets?" banner on Your profile
 *   edit: tap the pencil on one of your requests; "Save changes" and "Remove request"
 * What you need and the first day are required; with only a first day, it's a one-day request.
 * Left out for now: "Pet playdates" (not something sitters offer yet) and "Locate me".
 */
export interface CareRequestProps {
  mode?: 'new' | 'edit'
  initial?: Partial<CareRequestValues>
  /** Your first name, for "Eva needs" on the preview */
  ownerName: string
  /** Your pets to choose from */
  pets: PetSummary[]
  /** Where, before you type anything: usually your city */
  defaultArea?: string | null
  onSubmit?: (values: CareRequestValues) => Promise<void> | void
  onBack?: () => void
  onRemove?: () => Promise<void> | void
}

export function CareRequest({ mode = 'new', initial, ownerName, pets, defaultArea, onSubmit, onBack, onRemove }: CareRequestProps) {
  const [needs, setNeeds] = useState<OfferId[]>(initial?.needs ?? [])
  const [start, setStart] = useState<string | null>(initial?.start_date ?? null)
  const [end, setEnd] = useState<string | null>(initial?.end_date ?? null)
  const [area, setArea] = useState(initial?.area ?? defaultArea ?? '')
  // A new request starts with every pet chosen when there's only one
  const [petIds, setPetIds] = useState<string[]>(initial?.pet_ids ?? (pets.length === 1 ? [pets[0].id] : []))
  const [previewing, setPreviewing] = useState(false)
  const [triedOnce, setTriedOnce] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const needsError = triedOnce && needs.length === 0 ? 'Pick at least one kind of care' : undefined
  const datesError = triedOnce && !start ? 'Pick the first day you need care' : undefined
  const petsError = triedOnce && pets.length > 0 && petIds.length === 0 ? 'Pick at least one pet' : undefined

  // Pets that were removed since the request was made are quietly dropped
  const chosenPets = pets.filter((p) => petIds.includes(p.id))
  const values = (): CareRequestValues => ({
    needs,
    start_date: start as string,
    end_date: end ?? (start as string),
    area: area.trim() || null,
    pet_ids: chosenPets.map((p) => p.id),
  })

  function goToFirstError() {
    const id = needs.length === 0 ? 'request-needs' : !start ? 'request-when' : 'request-pets'
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function preview() {
    setTriedOnce(true)
    if (needs.length === 0 || !start || (pets.length > 0 && petIds.length === 0)) return goToFirstError()
    setFormError(null)
    setPreviewing(true)
    window.scrollTo(0, 0)
  }

  async function submit() {
    setSubmitting(true)
    setFormError(null)
    try {
      await onSubmit?.(values())
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleNeed = (id: OfferId) => (on: boolean) => setNeeds((list) => (on ? [...list, id] : list.filter((n) => n !== id)))
  const title = mode === 'edit' ? 'Your request' : 'Create a request'

  if (previewing) {
    const v = values()
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
        <Header title={title} onBack={() => setPreviewing(false)} backLabel="Back to your request" />
        <div className="flex flex-1 flex-col gap-xl px-l pt-s pb-[40px]">
          <p className="text-body text-medium-grey">
            This is how your circle will see your request. Other members see it too, with how many pets instead of who they are.
          </p>
          <RequestCard title={`${ownerName} needs`} needs={v.needs} startDate={v.start_date} endDate={v.end_date} area={v.area} pets={chosenPets} />
          {formError && <FormError>{formError}</FormError>}
          <div className="mt-auto flex flex-col items-center gap-m pt-xl">
            <Button variant="neutral" iconRight={Check} onClick={submit} disabled={submitting} aria-busy={submitting || undefined}>
              {submitting ? (mode === 'edit' ? 'Saving…' : 'Publishing…') : mode === 'edit' ? 'Save changes' : 'Publish request'}
            </Button>
            <Button variant="ghost" size="small" onClick={() => setPreviewing(false)} disabled={submitting}>
              Change something
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
      <Header title={title} onBack={onBack} />
      <div className="flex flex-1 flex-col gap-xl px-l pt-s pb-[40px]">
        <section id="request-needs" className="flex flex-col gap-m" aria-labelledby="request-needs-title">
          <h2 id="request-needs-title" className="text-overline text-dark-grey">
            What you need
          </h2>
          <div className="flex flex-wrap gap-s" role="group" aria-labelledby="request-needs-title">
            {OFFERS.map((o) => (
              <SelectableTag key={o.id} label={o.label} color={o.color} selected={needs.includes(o.id)} onChange={toggleNeed(o.id)} />
            ))}
          </div>
          {needsError && (
            <p role="alert" className="text-label text-error">
              {needsError}
            </p>
          )}
        </section>

        <section id="request-when" className="flex flex-col gap-m">
          <h2 className="text-overline text-dark-grey">When</h2>
          <MonthCalendar
            mode="range"
            label="When you need care"
            start={start}
            end={end}
            onRangeChange={(s, e) => {
              setStart(s)
              setEnd(e)
            }}
          />
          <p className="text-caption text-medium-grey" aria-live="polite">
            {start
              ? `${dateRangeLabel(start, end ?? start)}${end ? '' : ' · tap a later day to make it longer'}`
              : 'Tap the first day, then the last one. One tap is a single day.'}
          </p>
          {datesError && (
            <p role="alert" className="text-label text-error">
              {datesError}
            </p>
          )}
        </section>

        <section className="flex flex-col gap-m">
          <h2 className="text-overline text-dark-grey">Where</h2>
          <TextInput
            id="request-area"
            label="Where"
            hideLabel
            placeholder="Your area, e.g. Torremolinos, Málaga"
            icon={MapPin}
            maxLength={60}
            autoCapitalize="words"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          />
        </section>

        {pets.length > 0 && (
          <section id="request-pets" className="flex flex-col gap-m">
            <h2 className="text-overline text-dark-grey">Who do you need care for?</h2>
            <PetPicker multiple label="Who do you need care for?" pets={pets} values={petIds} onChangeMany={setPetIds} />
            {petsError && (
              <p role="alert" className="text-label text-error">
                {petsError}
              </p>
            )}
          </section>
        )}

        {formError && <FormError>{formError}</FormError>}

        <div className="mt-auto flex flex-col items-center gap-m pt-xl">
          <Button variant="neutral" onClick={preview}>
            Preview request
          </Button>
          {mode === 'edit' && onRemove && (
            <ConfirmAction
              size="small"
              icon={Trash2}
              label="Remove request"
              confirmLabel="Yes, remove"
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
      </div>
    </main>
  )
}
