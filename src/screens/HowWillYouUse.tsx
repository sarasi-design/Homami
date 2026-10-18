import { useState } from 'react'
import { Button } from '../components/basics/Button'
import { ChoiceCard, ChoiceGroup } from '../components/blocks/ChoiceCard'
import { FormError } from './WelcomeLayout'
import useCare from '../assets/use-care.webp'
import useOffer from '../assets/use-offer.webp'
import useBoth from '../assets/use-both.webp'

/**
 * How will you use Homami? — Figma ONBOARDING (85:10906). Right after "Let's set up your profile".
 *   I need care for my pets → add your pet
 *   I offer care for pets   → set up your pet sitter profile (no pet needed)
 *   Both                    → add your pet, then your pet sitter profile
 */
export type Wants = 'care' | 'offer' | 'both'

export interface HowWillYouUseProps {
  onSubmit?: (wants: Wants) => Promise<void> | void
}

const CHOICES: { id: Wants; label: string; image: string }[] = [
  { id: 'care', label: 'I need care for my pets', image: useCare },
  { id: 'offer', label: 'I offer care for pets', image: useOffer },
  { id: 'both', label: 'Both', image: useBoth },
]

export function HowWillYouUse({ onSubmit }: HowWillYouUseProps) {
  const [chosen, setChosen] = useState<Wants | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function next() {
    if (!chosen) return setError('Pick one to continue. You can always change it later.')
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit?.(chosen)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-xl bg-surface px-l pt-[min(104px,12dvh)] pb-[40px]">
      <h1 className="text-center text-title font-medium text-dark-sage">How will you use Homami?</h1>
      <ChoiceGroup label="How will you use Homami?">
        {CHOICES.map((c) => (
          <ChoiceCard
            key={c.id}
            align="start"
            label={c.label}
            image={c.image}
            selected={chosen === c.id}
            onClick={() => {
              setChosen(c.id)
              setError(null)
            }}
          />
        ))}
      </ChoiceGroup>
      {error && <FormError>{error}</FormError>}
      <div className="mt-auto flex justify-center pt-xl">
        <Button variant="neutral" onClick={next} disabled={submitting} aria-busy={submitting || undefined}>
          {submitting ? 'Saving…' : 'Next'}
        </Button>
      </div>
    </main>
  )
}
