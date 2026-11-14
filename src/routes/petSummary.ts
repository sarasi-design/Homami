import type { PetSummary } from '../components/blocks/PetsSection'
import { formatAge } from '../lib/pets'
import type { Pet } from '../lib/pets'

/** A pet, as the pet cards show it */
export const toPetSummary = (pet: Pet): PetSummary => ({
  id: pet.id,
  name: pet.name,
  kindLabel: pet.kind === 'dog' ? 'Dog' : 'Cat',
  ageLabel: formatAge(pet.age),
  photoUrl: pet.photo_url,
})
