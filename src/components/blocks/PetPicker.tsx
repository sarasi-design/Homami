import clsx from 'clsx'
import { Avatar } from '../basics/Avatar'

/**
 * PetPicker — choose which pet something is about: a row of pet Avatars (large) with names.
 * The chosen one gets a 3px Soft sage ring (same as the chosen ChoiceCard). Tap again to unselect.
 */
export interface PetPickerProps {
  label: string
  pets: { id: string; name: string; photoUrl?: string | null }[]
  value: string | null
  onChange: (id: string | null) => void
}

export function PetPicker({ label, pets, value, onChange }: PetPickerProps) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-l">
      {pets.map((pet) => {
        const selected = pet.id === value
        return (
          <button
            key={pet.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(selected ? null : pet.id)}
            className="flex w-[88px] cursor-pointer flex-col items-center gap-s rounded-small outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-sage"
          >
            <span className={clsx('rounded-pill p-[3px] transition-shadow', selected ? 'shadow-[0_0_0_3px_var(--color-soft-sage)]' : '')}>
              <Avatar size="large" name={pet.name} src={pet.photoUrl ?? undefined} />
            </span>
            <span className={clsx('text-label', selected ? 'text-label-bold text-dark-grey' : 'text-medium-grey')}>{pet.name}</span>
          </button>
        )
      })}
    </div>
  )
}
