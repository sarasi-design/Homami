import { describe, expect, it } from 'vitest'
import { nearCountLabel, roughly } from './location'

describe('your rough location (script 21)', () => {
  it('keeps only about 1 km: two decimals', () => {
    expect(roughly(36.721349)).toBe(36.72)
    expect(roughly(-4.42149)).toBe(-4.42)
  })

  it('says how many pet sitters are near you', () => {
    expect(nearCountLabel(0)).toBe('No pet sitters near you yet')
    expect(nearCountLabel(1)).toBe('1 pet sitter near you')
    expect(nearCountLabel(4)).toBe('4 pet sitters near you')
  })

})
