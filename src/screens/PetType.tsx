import { useState } from 'react'
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
  onChoose?: (kind: PetKind) => void
  /** Shows a back arrow, e.g. when adding a second pet */
  onBack?: () => void
}

export function PetType({ onChoose, onBack }: PetTypeProps) {
  const [chosen, setChosen] = useState<PetKind | null>(null)

  function choose(kind: PetKind) {
    setChosen(kind)
    window.setTimeout(() => onChoose?.(kind), 250) // let the selected border show before moving on
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
      <Header title="Set up profile" onBack={onBack} />
      <div className="flex flex-col gap-xl px-l pt-xl pb-[40px]">
        <h2 className="pl-s text-overline text-dark-grey">Tell us about your pet</h2>
        <ChoiceGroup label="What kind of pet?">
          <ChoiceCard label="Dog" image={petDog} selected={chosen === 'dog'} onClick={() => choose('dog')} />
          <ChoiceCard label="Cat" image={petCat} selected={chosen === 'cat'} onClick={() => choose('cat')} />
        </ChoiceGroup>
      </div>
    </main>
  )
}
