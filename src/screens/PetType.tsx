import { useState } from 'react'
import { Button } from '../components/basics/Button'
import { Header } from '../components/blocks/Header'
import { ChoiceCard, ChoiceGroup } from '../components/blocks/ChoiceCard'
import petDog from '../assets/pet-dog.webp'
import petCat from '../assets/pet-cat.webp'

/**
 * Tell us about your pet — Figma ONBOARDING (85:10601). Pick Dog or Cat;
 * the chosen card lights up for a moment, then the pet form opens.
 */
export type PetKind = 'dog' | 'cat'

export interface PetTypeProps {
  /** Header title: 'Set up profile' during sign-up, 'Add a pet' from Your profile */
  title?: string
  onChoose?: (kind: PetKind) => void
  /** Shows a back arrow, e.g. when adding a second pet */
  onBack?: () => void
  /** During sign-up: "Skip for now" at the bottom, for people who'd rather add their pet later */
  onSkip?: () => void
}

export function PetType({ onChoose, onBack, onSkip, title = 'Set up profile' }: PetTypeProps) {
  const [chosen, setChosen] = useState<PetKind | null>(null)

  function choose(kind: PetKind) {
    setChosen(kind)
    window.setTimeout(() => onChoose?.(kind), 250) // let the selected border show before moving on
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
      <Header title={title} onBack={onBack} />
      <div className="flex flex-1 flex-col gap-xl px-l pt-xl pb-[40px]">
        <h2 className="pl-s text-overline text-dark-grey">Tell us about your pet</h2>
        <ChoiceGroup label="What kind of pet?">
          <ChoiceCard label="Dog" image={petDog} selected={chosen === 'dog'} onClick={() => choose('dog')} />
          <ChoiceCard label="Cat" image={petCat} selected={chosen === 'cat'} onClick={() => choose('cat')} />
        </ChoiceGroup>
        {onSkip && (
          <div className="mt-auto flex justify-center pt-xl">
            <Button variant="ghost" size="small" onClick={onSkip}>
              Skip for now
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
