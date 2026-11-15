import { describe, expect, it } from 'vitest'
import { petsLine, publicRecommendedLabel } from './recommendations'

describe('words for recommendations', () => {
  it('says which pets the sitter looked after', () => {
    expect(petsLine([])).toBeNull()
    expect(petsLine(['Luna'])).toBe('Looked after Luna')
    expect(petsLine(['Luna', 'Milo'])).toBe('Looked after Luna and Milo')
    expect(petsLine(['Luna', 'Milo', 'Kiki'])).toBe('Looked after Luna, Milo and Kiki')
  })

  it('sums up who recommends a sitter on their public page', () => {
    expect(publicRecommendedLabel([], 0)).toBeNull()
    expect(publicRecommendedLabel(['Anna'], 1)).toBe('Recommended by Anna')
    expect(publicRecommendedLabel(['Anna', 'Francesca'], 2)).toBe('Recommended by Anna and Francesca')
    expect(publicRecommendedLabel(['Anna', 'Francesca', 'Tom', 'Eva', 'Leo'], 5)).toBe('Recommended by Anna, Francesca and 3 others')
    expect(publicRecommendedLabel(['Anna', 'Francesca', 'Tom'], 3)).toBe('Recommended by Anna, Francesca and 1 other')
  })
})
// The sitter's link (address, remembering it across sign-up) is tried in a real browser: e2e/logged-out.e2e.ts
