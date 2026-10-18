// A made-up pet sitter for Storybook examples.
import type { OfferId } from '../lib/sitters'

const inAMonth = () => {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().slice(0, 10)
}

export const sampleSitter = {
  offers: ['live_in', 'dog_walking', 'boarding'] as OfferId[],
  available_from: inAMonth(),
  area: 'Málaga Centro',
  radius_km: 30,
  travels: true,
  daily_rate: 25,
  overnight_rate: 35,
  walk_rate: 9,
  stay_for_care: true,
  sitting_exchange: false,
}

