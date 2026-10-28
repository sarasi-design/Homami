import { Plus } from 'lucide-react'
import { Avatar } from '../basics/Avatar'
import { IconButton } from '../basics/Button'

/**
 * PetsSection — Figma "Add Pet Section" (74:6937): a card (12px corners, Soft grey border,
 * 16px padding) listing pets, each an Avatar (large) with type (Caption), name (Body Bold) and age (Caption).
 *
 * Two modes (Sara, Oct 28), so the section stays compact once you've added your pets:
 *   saved    compact: a smaller photo (medium, 44px), the name, and "Dog · 4 years old". No add tile.
 *            (With no pets yet it shows the + tile, so adding the first one is one tap.)
 *   editing  the full card: large photos (tap one to edit that pet) and the + tile to add another.
 * The Edit / Done button sits next to the section title (see Your profile).
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
  /** Shows the + tile (when editing, or when there are no pets yet) */
  onAdd?: () => void
  /** Editing: tap a pet to edit it */
  onOpen?: (id: string) => void
  editing?: boolean
}

function PetInfo({ pet }: { pet: PetSummary }) {
  return (
    <>
      <Avatar size="large" name={pet.name} src={pet.photoUrl ?? undefined} />
      <span className="flex min-w-0 flex-col gap-xs text-left">
        <span className="text-caption text-medium-grey">{pet.kindLabel}</span>
        <span className="truncate text-body-bold text-dark-grey">{pet.name}</span>
        {pet.ageLabel && <span className="text-caption text-medium-grey">{pet.ageLabel}</span>}
      </span>
    </>
  )
}

function AddTile({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex min-h-[76px] min-w-[120px] flex-1 items-center justify-center rounded-small border border-soft-grey">
      <IconButton icon={Plus} label="Add a pet" onClick={onAdd} />
    </div>
  )
}

export function PetsSection({ pets, onAdd, onOpen, editing = false }: PetsSectionProps) {
  // Editing, or no pets yet: the full card with the + tile
  if (editing || pets.length === 0) {
    return (
      <div className="flex flex-wrap gap-l rounded-card border border-soft-grey p-l">
        {pets.map((pet) =>
          onOpen ? (
            <button
              key={pet.id}
              type="button"
              onClick={() => onOpen(pet.id)}
              aria-label={`Edit ${pet.name}`}
              className="flex cursor-pointer items-center gap-s rounded-small outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-primary-sage"
            >
              <PetInfo pet={pet} />
            </button>
          ) : (
            <div key={pet.id} className="flex items-center gap-s">
              <PetInfo pet={pet} />
            </div>
          ),
        )}
        {onAdd && <AddTile onAdd={onAdd} />}
      </div>
    )
  }

  // Saved: compact
  return (
    <ul className="flex flex-wrap gap-x-xl gap-y-m">
      {pets.map((pet) => (
        <li key={pet.id} className="flex items-center gap-s">
          <Avatar size="medium" name={pet.name} src={pet.photoUrl ?? undefined} />
          <span className="flex flex-col">
            <span className="text-body-bold text-dark-grey">{pet.name}</span>
            <span className="text-caption text-medium-grey">{[pet.kindLabel, pet.ageLabel].filter(Boolean).join(' · ')}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}
