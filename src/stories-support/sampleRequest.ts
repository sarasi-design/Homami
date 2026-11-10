// A made-up pet care request for Storybook examples: a week, starting in two weeks.
import type { OfferId } from '../lib/sitters'

const inDays = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const sampleRequest = {
  needs: ['live_in'] as OfferId[],
  start_date: inDays(14),
  end_date: inDays(20),
  area: 'Torremolinos, Málaga',
  pet_ids: ['1'],
}
