import { useEffect, useState } from 'react'
import { PersonPage } from '../screens/CircleScreens'
import { getPerson } from '../lib/circle'
import type { PersonProfile } from '../lib/circle'
import { listPetsOf } from '../lib/pets'
import type { Pet } from '../lib/pets'
import { getSitterProfile } from '../lib/sitters'
import type { SitterProfile } from '../lib/sitters'
import { listRequestsOf } from '../lib/requests'
import type { CareRequest } from '../lib/requests'
import { go, goBack } from '../lib/router'
import { toPetSummary } from './petSummary'

/** Loads one person (in your circle, or a pet sitter), their pets and their pet sitting */
export function PersonRoute({ id, inCircle, chattedWith, isMe, onBook }: { id: string; inCircle: boolean; chattedWith: boolean; isMe: boolean; onBook: () => void }) {
  const [person, setPerson] = useState<PersonProfile | null | undefined>(undefined)
  const [pets, setPets] = useState<Pet[] | undefined>(undefined)
  const [sitter, setSitter] = useState<SitterProfile | null>(null)
  const [requests, setRequests] = useState<CareRequest[]>([])
  useEffect(() => {
    let cancelled = false
    getPerson(id).then((p) => !cancelled && setPerson(p)).catch(() => !cancelled && setPerson(null))
    listRequestsOf(id).then((list) => !cancelled && setRequests(list)).catch(() => {})
    listPetsOf(id).then((list) => !cancelled && setPets(list)).catch(() => !cancelled && setPets([]))
    getSitterProfile(id).then((s) => !cancelled && setSitter(s)).catch(() => {})
    return () => {
      cancelled = true
    }
  }, [id])
  // You can message people in your circle, pet sitters, people asking for pet care (script 10),
  // and anyone you already have a chat with
  const canMessage = !isMe && (inCircle || !!sitter || requests.length > 0 || chattedWith)
  return (
    <PersonPage
      person={person && { name: person.first_name ?? 'New member', photoUrl: person.avatar_url, city: person.city, bio: person.bio }}
      pets={inCircle ? pets?.map(toPetSummary) : null}
      sitter={sitter}
      requests={requests}
      onBook={sitter && !isMe ? onBook : undefined}
      onBack={goBack}
      onMessage={canMessage ? () => go(`/chats/${id}`) : undefined}
    />
  )
}
