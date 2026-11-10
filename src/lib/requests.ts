import { supabase } from './supabase'
import type { OfferId } from './sitters'

/**
 * Pet care requests (database script 10): "I need someone for my pets", with what kind of care,
 * which dates, where and which pets. Every member can see requests; only you can change yours.
 * The kinds of care are the same list pet sitters offer (OFFERS), so the two can be matched later.
 */
export interface CareRequest {
  id: string
  owner_id: string
  needs: OfferId[]
  start_date: string // 'YYYY-MM-DD'
  end_date: string // 'YYYY-MM-DD'
  area: string | null
  /** Your pets. Other people only see these if they're in your circle (pets stay private). */
  pet_ids: string[]
  /** So people outside your circle can still read "2 pets" */
  pet_count: number
}

export type CareRequestValues = Pick<CareRequest, 'needs' | 'start_date' | 'end_date' | 'area' | 'pet_ids'>

const offline = 'We couldn’t reach Homami. Check your connection and try again.'
/** A missing table means database script 10 hasn't been run yet. */
const needsUpdate = 'Homami’s database needs an update for pet care requests (setup script 10). Please try again later.'
const friendly = (error: { code?: string; message?: string }) =>
  error.code === '42P01' || error.code === '42703' || error.code === 'PGRST204' || error.code === 'PGRST205' || /column|relation|schema cache/i.test(error.message ?? '')
    ? needsUpdate
    : offline
const columns = 'id, owner_id, needs, start_date, end_date, area, pet_ids, pet_count'

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Someone's requests that haven't ended yet, soonest first. */
export async function listRequestsOf(ownerId: string): Promise<CareRequest[]> {
  const { data, error } = await supabase
    .from('care_requests')
    .select(columns)
    .eq('owner_id', ownerId)
    .gte('end_date', today())
    .order('start_date')
  if (error) throw new Error(friendly(error))
  return data as CareRequest[]
}

export async function createRequest(ownerId: string, values: CareRequestValues): Promise<CareRequest> {
  const { data, error } = await supabase
    .from('care_requests')
    .insert({ owner_id: ownerId, ...values, pet_count: values.pet_ids.length })
    .select(columns)
    .single()
  if (error) {
    console.error('Creating a care request failed', error)
    throw new Error(friendly(error))
  }
  return data as CareRequest
}

export async function updateRequest(id: string, values: CareRequestValues): Promise<CareRequest> {
  const { data, error } = await supabase
    .from('care_requests')
    .update({ ...values, pet_count: values.pet_ids.length, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(columns)
    .single()
  if (error) {
    console.error('Updating a care request failed', error)
    throw new Error(friendly(error))
  }
  return data as CareRequest
}

export async function removeRequest(id: string): Promise<void> {
  const { error } = await supabase.from('care_requests').delete().eq('id', id)
  if (error) throw new Error(friendly(error))
}

// ---- Words for people ----------------------------------------------------------------------

const at = (date: string) => new Date(`${date}T12:00:00`)

/**
 * Written the same way as the rest of the app (formatDate in sitters.ts):
 * "3 September 2026" · "1 to 7 September 2026" · "30 August to 2 September 2026"
 * · "30 December 2026 to 2 January 2027"
 */
export function dateRangeLabel(start: string, end: string) {
  const a = at(start)
  const b = at(end)
  const full = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const month = (d: Date) => d.toLocaleDateString('en-GB', { month: 'long' })
  if (start === end) return full(a)
  if (a.getFullYear() !== b.getFullYear()) return `${full(a)} to ${full(b)}`
  if (a.getMonth() === b.getMonth()) return `${a.getDate()} to ${b.getDate()} ${month(a)} ${a.getFullYear()}`
  return `${a.getDate()} ${month(a)} to ${b.getDate()} ${month(b)} ${b.getFullYear()}`
}
