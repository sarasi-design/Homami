import { describe, expect, it } from 'vitest'
import { alternate, buildWall, mix, relationOf, sitterCards } from './wall'
import type { WallItem } from '../screens/CircleScreens'
import type { SitterListing } from './sitters'

const people = { circleIds: new Set(['bea']), extendedIds: new Set(['eli']), myCity: 'Málaga' }

describe('who is placed where on the wall', () => {
  it('puts your circle first, then your extended circle, then your city, then everyone else', () => {
    expect(relationOf('bea', 'Madrid', people)).toMatchObject({ rank: 0, label: 'In your circle' })
    expect(relationOf('eli', 'Madrid', people)).toMatchObject({ rank: 1, label: 'In your extended circle' })
    expect(relationOf('dani', ' málaga ', people)).toMatchObject({ rank: 2, label: 'Near you · málaga' })
    expect(relationOf('fran', 'Sevilla', people)).toMatchObject({ rank: 3, label: 'Sevilla' })
    expect(relationOf('gus', null, people)).toMatchObject({ rank: 3, label: 'On Homami' })
  })

  it('orders pet sitters by that, closest first', () => {
    const sitter = (id: string, city: string): SitterListing => ({
      user_id: id, offers: [], available_from: null, available_until: null, area: null, radius_km: null, travels: true,
      daily_rate: 20, overnight_rate: null, walk_rate: null, stay_for_care: false, sitting_exchange: false,
      profile: { first_name: id, city, avatar_url: null },
    })
    const order = sitterCards([sitter('fran', 'Sevilla'), sitter('dani', 'Málaga'), sitter('bea', 'Madrid')], people).map((c) => c.id)
    expect(order).toEqual(['bea', 'dani', 'fran'])
  })

  it('puts the nearest sitters first, with how far they are (script 21)', () => {
    const sitter = (id: string, city: string): SitterListing => ({
      user_id: id, offers: [], available_from: null, available_until: null, area: null, radius_km: null, travels: true,
      daily_rate: 20, overnight_rate: null, walk_rate: null, stay_for_care: false, sitting_exchange: false,
      profile: { first_name: id, city, avatar_url: null },
    })
    const cards = sitterCards([sitter('bea', 'Madrid'), sitter('fran', 'Sevilla'), sitter('dani', 'Málaga'), sitter('gus', 'Cádiz')], people, {}, {
      bea: 400, fran: 2, dani: 1, gus: null,
    })
    expect(cards.map((c) => c.id)).toEqual(['dani', 'fran', 'bea', 'gus'])
    const label = (id: string) => cards.find((c) => c.id === id)?.kind === 'sitter' && (cards.find((c) => c.id === id) as { relation: string }).relation
    expect(label('dani')).toBe('1 km away · Málaga')
    expect(label('bea')).toBe('In your circle · 400 km away')
    expect(label('gus')).toBe('Cádiz')
  })

  it('puts sitters recommended by your circle first, with "Recommended by" on top of their card', () => {
    const sitter = (id: string, city: string): SitterListing => ({
      user_id: id, offers: [], available_from: null, available_until: null, area: null, radius_km: null, travels: true,
      daily_rate: 20, overnight_rate: null, walk_rate: null, stay_for_care: false, sitting_exchange: false,
      profile: { first_name: id, city, avatar_url: null },
    })
    const summary = (sitter_id: string, closeness: 0 | 1 | 2) => ({
      sitter_id, review_count: 0, rating_avg: 0, recommend_count: 1,
      known_recommenders: [{ id: 'bea', first_name: 'Bea', avatar_url: null, closeness }],
    })
    const cards = sitterCards([sitter('bea', 'Madrid'), sitter('dani', 'Málaga'), sitter('fran', 'Sevilla'), sitter('gus', 'Cádiz')], people, {
      fran: summary('fran', 1),
      gus: summary('gus', 2),
    })
    expect(cards.map((c) => c.id)).toEqual(['fran', 'bea', 'dani', 'gus'])
    const fran = cards[0] as { recommendedFirst?: boolean; recommended?: { label: string }; rating?: unknown }
    expect(fran.recommendedFirst).toBe(true)
    expect(fran.recommended?.label).toBe('Recommended by Bea')
    expect(fran.rating).toBeUndefined() // no reviews yet: no hearts
    expect((cards[3] as { recommendedFirst?: boolean }).recommendedFirst).toBe(false) // a friend of a friend: shown, but not first
  })
})

describe('mixing posts and cards', () => {
  it('takes turns between sitters and requests', () => {
    expect(alternate(['s1', 's2', 's3'], ['r1'])).toEqual(['s1', 'r1', 's2', 's3'])
  })
  it('puts a card after every 3 posts, and the rest at the end', () => {
    expect(mix(['p1', 'p2', 'p3', 'p4'], ['c1', 'c2'])).toEqual(['p1', 'p2', 'p3', 'c1', 'p4', 'c2'])
    expect(mix([], ['c1'])).toEqual(['c1']) // no posts yet: all cards
  })
})

describe('the wall filters', () => {
  const post = { kind: 'post', id: 'p1' } as WallItem
  const card = (id: string, group: 'circle' | 'extended' | 'other') => ({ kind: 'sitter', id, group }) as WallItem & { group: typeof group }
  const sitters = [card('s-circle', 'circle'), card('s-ext', 'extended'), card('s-other', 'other')]
  const ids = (items: WallItem[]) => items.map((i) => i.id)

  it('All: posts with every card', () => {
    expect(ids(buildWall('all', [post], sitters, []))).toEqual(['p1', 's-circle', 's-ext', 's-other'])
  })
  it('Circle: posts with your circle’s cards only', () => {
    expect(ids(buildWall('circle', [post], sitters, []))).toEqual(['p1', 's-circle'])
  })
  it('Extended circle: only extended circle cards, no posts', () => {
    expect(ids(buildWall('extended', [post], sitters, []))).toEqual(['s-ext'])
  })
  it('Sitters: only pet sitters', () => {
    expect(ids(buildWall('sitters', [post], sitters, []))).toEqual(['s-circle', 's-ext', 's-other'])
  })
})
