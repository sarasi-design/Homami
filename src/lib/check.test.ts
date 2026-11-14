import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { many, maybeOne, money, ODD_ANSWER, one } from './check'

// Checking what comes back from the database (Zod)
const pet = z.object({ id: z.string(), name: z.string() })

describe('checking answers from the database', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})

  it('accepts a row that looks right, and drops columns the app doesn’t use', () => {
    expect(one(pet, { id: '1', name: 'Luna', secret: 'x' }, 'a pet')).toEqual({ id: '1', name: 'Luna' })
  })
  it('turns a row that looks wrong into a message people can read', () => {
    expect(() => one(pet, { id: 1 }, 'a pet')).toThrow(ODD_ANSWER)
  })
  it('allows “nothing” where there may be nothing', () => {
    expect(maybeOne(pet, null, 'a pet')).toBeNull()
  })
  it('leaves an odd row out of a list instead of emptying the page', () => {
    expect(many(pet, [{ id: '1', name: 'Luna' }, { id: '2' }, { id: '3', name: 'Rocky' }], 'pets').map((p) => p.name)).toEqual(['Luna', 'Rocky'])
    expect(many(pet, null, 'pets')).toEqual([])
  })
  it('turns money sent as text back into numbers', () => {
    expect(money.parse('12.50')).toBe(12.5)
    expect(money.parse(9)).toBe(9)
    expect(money.parse(null)).toBeNull()
  })
})
