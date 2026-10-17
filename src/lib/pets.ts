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

export async function listMyPets(): Promise<Pet[]> {
  const { data, error } = await supabase.from('pets').select(columns).order('created_at')
  if (error) throw new Error(offline)
  return data as Pet[]
}

/** "9" → "9 years old", "1" → "1 year old"; anything else (e.g. "4 months") is shown as written. */
export function formatAge(age: string | null) {
  if (!age) return null
  const n = Number(age)
  if (Number.isFinite(n) && /^\d+$/.test(age)) return `${n} ${n === 1 ? 'year' : 'years'} old`
  return age
}

export async function addPet(userId: string, { kind, name, age, description, photo }: PetValues): Promise<Pet> {
  let photoUrl: string | null = null
  if (photo) {
    let blob: Blob
    try {
      blob = await shrinkImage(photo)
    } catch {
      throw new Error('That photo couldn’t be opened. Try a different one, or skip it for now.')
    }
    const path = `${userId}/pet-${Date.now()}.jpg`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg' })
    if (uploadError) throw new Error('The photo didn’t upload. Try again, or skip it for now.')
    photoUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
  }
  const { data, error } = await supabase
    .from('pets')
    .insert({ kind, name, age: age || null, description: description || null, photo_url: photoUrl })
    .select(columns)
    .single()
  if (error) throw new Error(offline)
  return data as Pet
}
