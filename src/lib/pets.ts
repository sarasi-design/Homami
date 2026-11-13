import { supabase } from './supabase'
import { z } from 'zod'
import { many, maybeOne, one, photoOnly, text } from './check'
import { databaseError, needsUpdate } from './errors'
import { removePhoto, uploadPhoto, withPhotoLinks } from './photos'
import type { PetValues } from '../screens/AddPet'
import type { PetKind } from '../screens/PetType'

export interface Pet {
  id: string
  kind: PetKind
  name: string
  age: string | null
  description: string | null
  /** The link to show the photo with: a private link that works for an hour (older photos: a public link) */
  photo_url: string | null
}

const petSchema: z.ZodType<Pet> = z.object({
  id: z.string(),
  kind: z.enum(['dog', 'cat']),
  name: z.string(),
  age: text,
  description: text,
  photo_url: text,
})

/** Pet photos are private: you and your circle (database script 17, see photos.ts) */
const photoMessages = {
  unreadable: 'That photo couldn’t be opened. Try a different one, or skip it for now.',
  failed: 'The photo didn’t upload. Try again, or skip it for now.',
  needsUpdate: needsUpdate('pet photos', 'script 17'),
}

const columns = 'id, kind, name, age, description, photo_url'

/** Your own pets. (Circle friends' pets are visible too, so always filter by owner.) */
export async function listPetsOf(ownerId: string): Promise<Pet[]> {
  const { data, error } = await supabase.from('pets').select(columns).eq('owner_id', ownerId).order('created_at')
  if (error) throw databaseError(error)
  return withPhotoLinks('pet-photos', many(petSchema, data, 'pets'))
}

/** "9" → "9 years old", "1" → "1 year old"; anything else (e.g. "4 months") is shown as written. */
export function formatAge(age: string | null) {
  if (!age) return null
  const n = Number(age)
  if (Number.isFinite(n) && /^\d+$/.test(age)) return `${n} ${n === 1 ? 'year' : 'years'} old`
  // "6years old" → "6 years old"
  return age.replace(/^(\d+)\s*(?=[a-z])/i, '$1 ')
}

export async function addPet(userId: string, { kind, name, age, description, photo }: PetValues): Promise<Pet> {
  const photoPath = photo ? await uploadPhoto('pet-photos', userId, photo, 640, photoMessages) : null
  const { data, error } = await supabase
    .from('pets')
    .insert({ kind, name, age: age || null, description: description || null, photo_url: photoPath })
    .select(columns)
    .single()
  if (error) {
    await removePhoto('pet-photos', photoPath)
    throw databaseError(error)
  }
  const [pet] = await withPhotoLinks('pet-photos', [one(petSchema, data, 'your new pet')])
  return pet
}

/** Where a pet's photo lives now, so a replaced or removed photo can be removed too */
async function storedPhotoOf(petId: string): Promise<string | null> {
  const { data } = await supabase.from('pets').select('photo_url').eq('id', petId).maybeSingle()
  return maybeOne(photoOnly, data, 'a pet’s photo')?.photo_url ?? null
}

/** Edit pet. A new photo replaces the old one (which is removed); no new photo keeps it. */
export async function updatePet(userId: string, petId: string, { name, age, description, photo }: PetValues): Promise<Pet> {
  const changes: Record<string, string | null> = { name, age: age || null, description: description || null }
  const oldPhoto = photo ? await storedPhotoOf(petId) : null
  if (photo) changes.photo_url = await uploadPhoto('pet-photos', userId, photo, 640, photoMessages)
  const { data, error } = await supabase.from('pets').update(changes).eq('id', petId).select(columns).single()
  if (error) {
    await removePhoto('pet-photos', changes.photo_url)
    throw databaseError(error)
  }
  await removePhoto('pet-photos', oldPhoto)
  const [pet] = await withPhotoLinks('pet-photos', [one(petSchema, data, 'your pet')])
  return pet
}

/** Remove pet, and their photo. Posts about them stay on the wall, just without the pet's name. */
export async function removePet(petId: string): Promise<void> {
  const { data, error } = await supabase.from('pets').delete().eq('id', petId).select('photo_url').maybeSingle()
  if (error) throw databaseError(error)
  await removePhoto('pet-photos', maybeOne(photoOnly, data, 'a removed pet')?.photo_url)
}
