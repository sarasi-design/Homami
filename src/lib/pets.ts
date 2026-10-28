import { supabase } from './supabase'
import { shrinkImage } from './images'
import type { PetValues } from '../screens/AddPet'
import type { PetKind } from '../screens/PetType'

export interface Pet {
  id: string
  kind: PetKind
  name: string
  age: string | null
  description: string | null
  photo_url: string | null
}

const offline = 'We couldn’t reach Homami. Check your connection and try again.'
const columns = 'id, kind, name, age, description, photo_url'

/** Your own pets. (Circle friends' pets are visible too, so always filter by owner.) */
export async function listPetsOf(ownerId: string): Promise<Pet[]> {
  const { data, error } = await supabase.from('pets').select(columns).eq('owner_id', ownerId).order('created_at')
  if (error) throw new Error(offline)
  return data as Pet[]
}

/** "9" → "9 years old", "1" → "1 year old"; anything else (e.g. "4 months") is shown as written. */
export function formatAge(age: string | null) {
  if (!age) return null
  const n = Number(age)
  if (Number.isFinite(n) && /^\d+$/.test(age)) return `${n} ${n === 1 ? 'year' : 'years'} old`
  // "6years old" → "6 years old"
  return age.replace(/^(\d+)\s*(?=[a-z])/i, '$1 ')
}

async function uploadPetPhoto(userId: string, photo: File): Promise<string> {
  let blob: Blob
  try {
    blob = await shrinkImage(photo)
  } catch {
    throw new Error('That photo couldn’t be opened. Try a different one, or skip it for now.')
  }
  const path = `${userId}/pet-${Date.now()}.jpg`
  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg' })
  if (uploadError) throw new Error('The photo didn’t upload. Try again, or skip it for now.')
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
}

export async function addPet(userId: string, { kind, name, age, description, photo }: PetValues): Promise<Pet> {
  const photoUrl = photo ? await uploadPetPhoto(userId, photo) : null
  const { data, error } = await supabase
    .from('pets')
    .insert({ kind, name, age: age || null, description: description || null, photo_url: photoUrl })
    .select(columns)
    .single()
  if (error) throw new Error(offline)
  return data as Pet
}

/** Edit pet. A new photo replaces the old one; no new photo keeps it. */
export async function updatePet(userId: string, petId: string, { name, age, description, photo }: PetValues): Promise<Pet> {
  const changes: Record<string, string | null> = { name, age: age || null, description: description || null }
  if (photo) changes.photo_url = await uploadPetPhoto(userId, photo)
  const { data, error } = await supabase.from('pets').update(changes).eq('id', petId).select(columns).single()
  if (error) throw new Error(offline)
  return data as Pet
}

/** Remove pet. Posts about them stay on the wall, just without the pet's name. */
export async function removePet(petId: string): Promise<void> {
  const { error } = await supabase.from('pets').delete().eq('id', petId)
  if (error) throw new Error(offline)
}
