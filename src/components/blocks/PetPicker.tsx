import clsx from 'clsx'
import { Avatar } from '../basics/Avatar'

/**
 * PetPicker — choose which pet something is about: a row of pet Avatars (large) with names.
 * The chosen one gets a 3px Soft sage ring (same as the chosen ChoiceCard). Tap again to unselect.
 *
 * multiple (Create a request, "Who do you need care for?", Figma 90:6520): pick any number of pets;
 * each tap turns that pet on or off. Read out as checkboxes instead of radio buttons.
 */
interface Pet {
  id: string
  name: string
  photoUrl?: string | null
}
interface CommonProps {
  label: string
  pets: Pet[]
}
interface SingleProps extends CommonProps {
  multiple?: false
  value: string | null
  onChange: (id: string | null) => void
}
interface MultipleProps extends CommonProps {
  multiple: true
  values: string[]
  onChangeMany: (ids: string[]) => void
}
export type PetPickerProps = SingleProps | MultipleProps

export function PetPicker(props: PetPickerProps) {
  const { label, pets } = props
  const isSelected = (id: string) => (props.multiple ? props.values.includes(id) : id === props.value)
  const toggle = (id: string) => {
    if (props.multiple) {
      props.onChangeMany(props.values.includes(id) ? props.values.filter((v) => v !== id) : [...props.values, id])
    } else {
      props.onChange(id === props.value ? null : id)
    }
  }
  return (
    <div role={props.multiple ? 'group' : 'radiogroup'} aria-label={label} className="flex flex-wrap gap-l">
      {pets.map((pet) => {
        const selected = isSelected(pet.id)
        return (
          <button
            key={pet.id}
            type="button"
            role={props.multiple ? 'checkbox' : 'radio'}
            aria-checked={selected}
            onClick={() => toggle(pet.id)}
            className="flex w-[88px] cursor-pointer flex-col items-center gap-s rounded-small outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-sage"
          >
            <span className={clsx('flex rounded-pill p-[3px] transition-shadow', selected ? 'shadow-[0_0_0_3px_var(--color-soft-sage)]' : '')}>
              <Avatar size="large" name={pet.name} src={pet.photoUrl ?? undefined} />
            </span>
            <span className={clsx('text-label', selected ? 'text-label-bold text-dark-grey' : 'text-medium-grey')}>{pet.name}</span>
          </button>
        )
      })}
    </div>
  )
}
