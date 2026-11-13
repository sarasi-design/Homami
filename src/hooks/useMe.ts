import { useEffect, useState } from 'react'
import { getMyProfile } from '../lib/profile'
import type { Profile } from '../lib/profile'
import { listPetsOf } from '../lib/pets'
import type { Pet } from '../lib/pets'
import { getSitterProfile } from '../lib/sitters'
import type { SitterProfile } from '../lib/sitters'
import { rememberSkip, rememberedSkip } from '../lib/skips'

/**
 * You: your profile, your pets and your pet sitting, loaded together once you log in
 * (so the setup steps never flash by before they're known). `loaded` is false until all three are in.
 */
export function useMe(userId: string) {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined)
  const [pets, setPets] = useState<Pet[] | undefined>(undefined)
  const [sitter, setSitter] = useState<SitterProfile | null | undefined>(undefined)
  useEffect(() => {
    let cancelled = false
    Promise.all([getMyProfile(userId).catch(() => null), listPetsOf(userId).catch(() => []), getSitterProfile(userId).catch(() => null)]).then(
      ([p, list, s]) => {
        if (cancelled) return
        setProfile(p)
        setPets(list)
        setSitter(s)
      },
    )
    return () => {
      cancelled = true
    }
  }, [userId])
  return { profile, setProfile, pets, setPets, sitter, setSitter }
}

/** "Skip for now" (first pet) and "Not now" (pet sitting), remembered on this phone */
export function useSetupSkips(userId: string) {
  const [skippedPet, setSkippedPet] = useState(() => rememberedSkip('pet', userId))
  const [skippedSitter, setSkippedSitter] = useState(() => rememberedSkip('sitter', userId))
  return {
    skippedPet,
    skippedSitter,
    skipPet: () => {
      rememberSkip('pet', userId)
      setSkippedPet(true)
    },
    skipSitter: () => {
      rememberSkip('sitter', userId)
      setSkippedSitter(true)
    },
  }
}
