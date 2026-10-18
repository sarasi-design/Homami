import { Plus } from 'lucide-react'
import { Avatar } from '../basics/Avatar'
import { IconButton } from '../basics/Button'

/**
 * PetsSection — Figma "Add Pet Section" (74:6937): a card (12px corners, Soft grey border,
 * 16px padding) listing pets, each an Avatar (large) with type (Caption), name (Body Bold)
 * and age (Caption), followed by a tile with a + Icon button to add another.
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
  onAdd?: () => void
  onOpen?: (id: string) => void
}

export function PetsSection({ pets, onAdd, onOpen }: PetsSectionProps) {
  return (
    <div className="flex flex-wrap gap-l rounded-card border border-soft-grey p-l">
      {pets.map((pet) => {
        const body = (
          <>
            <Avatar size="large" name={pet.name} src={pet.photoUrl ?? undefined} />
            <span className="flex flex-col gap-xs text-left">
              <span className="text-caption text-medium-grey">{pet.kindLabel}</span>
              <span className="text-body-bold text-dark-grey">{pet.name}</span>
              {pet.ageLabel && <span className="text-caption text-medium-grey">{pet.ageLabel}</span>}
            </span>
          </>
        )
        return onOpen ? (
          <button
            key={pet.id}
            type="button"
            onClick={() => onOpen(pet.id)}
            className="flex cursor-pointer items-center gap-s rounded-small outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-primary-sage"
          >
            {body}
          </button>
        ) : (
          <div key={pet.id} className="flex items-center gap-s">
            {body}
          </div>
        )
      })}
      {onAdd && (
        <div className="flex min-h-[76px] min-w-[120px] flex-1 items-center justify-center rounded-small border border-soft-grey">
          <IconButton icon={Plus} label="Add a pet" onClick={onAdd} />
        </div>
      )}
    </div>
  )
}
