import { Plus } from 'lucide-react'
import { Avatar } from '../basics/Avatar'
import { IconButton } from '../basics/Button'

/**
 * PetsSection — Figma "Add Pet Section" (74:6937): a card (12px corners, Soft grey border,
 * 16px padding) listing pets, each an Avatar (large) with type (Caption), name (Body Bold) and age (Caption).
 *
 * Compact (Sara, Oct 28–29): a smaller photo (medium, 44px), the name and "Dog · 4 years old";
 * tap a pet to edit it. Adding a pet is a + button next to the section title (see Your profile).
 * With no pets yet it shows the card with the + tile, so adding the first one is one tap.
 */
export interface PetSummary {
  id: string
  name: string
  kindLabel: string
  ageLabel?: string | null
  photoUrl?: string | null
}

export interface PetsSectionProps {
  pets: PetSummary[]
  /** Shows the + tile when there are no pets yet */
  onAdd?: () => void
  /** Tap a pet to edit it */
  onOpen?: (id: string) => void
}

function AddTile({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex min-h-[76px] min-w-[120px] flex-1 items-center justify-center rounded-small border border-soft-grey">
      <IconButton icon={Plus} label="Add a pet" onClick={onAdd} />
    </div>
  )
}

export function PetsSection({ pets, onAdd, onOpen }: PetsSectionProps) {
  // No pets yet: the card with the + tile
  if (pets.length === 0) {
    return onAdd ? (
      <div className="flex rounded-card border border-soft-grey p-l">
        <AddTile onAdd={onAdd} />
      </div>
    ) : null
  }

  return (
    <ul className="flex flex-wrap gap-x-xl gap-y-m">
      {pets.map((pet) => {
        const info = (
          <>
            <Avatar size="medium" name={pet.name} src={pet.photoUrl ?? undefined} />
            <span className="flex flex-col text-left">
              <span className="text-body-bold text-dark-grey">{pet.name}</span>
              <span className="text-caption text-medium-grey">{[pet.kindLabel, pet.ageLabel].filter(Boolean).join(' · ')}</span>
            </span>
          </>
        )
        return (
          <li key={pet.id}>
            {onOpen ? (
              <button
                type="button"
                onClick={() => onOpen(pet.id)}
                aria-label={`Edit ${pet.name}`}
                className="-m-xs flex cursor-pointer items-center gap-s rounded-small p-xs transition-colors hover:bg-light-grey/50 active:bg-light-grey outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-primary-sage"
              >
                {info}
              </button>
            ) : (
              <div className="flex items-center gap-s">{info}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
