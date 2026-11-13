import { describe, expect, it } from 'vitest'
import { databaseError, isMissingInDatabase, needsUpdate, OFFLINE } from './errors'
import { isStoredPath, newPhotoPath, pathFromPublicLink } from './photos'

describe('database errors in plain words', () => {
  const update = needsUpdate('chat', 'script 09')
  it('writes the “needs an update” sentence', () => {
    expect(update).toBe('Homami’s database needs an update for chat (setup script 09). Please try again later.')
  })
  it('spots a setup script that hasn’t been run', () => {
    expect(isMissingInDatabase({ code: 'PGRST205', message: 'Could not find the table' })).toBe(true)
    expect(isMissingInDatabase({ code: '42883' })).toBe(true)
    expect(isMissingInDatabase({ message: 'relation "public.messages" does not exist' })).toBe(true)
    expect(isMissingInDatabase({ code: '42501', message: 'new row violates row-level security policy' })).toBe(false)
  })
  it('passes on messages the database wrote for people', () => {
    expect(databaseError({ code: 'P0001', message: 'Add a card in Payment details first.' }).message).toBe('Add a card in Payment details first.')
  })
  it('says “needs an update” only when told which update', () => {
    expect(databaseError({ code: 'PGRST202' }, update).message).toBe(update)
    expect(databaseError({ code: 'PGRST202' }).message).toBe(OFFLINE)
  })
  it('falls back to “couldn’t reach Homami” and never shows technical details', () => {
    const e = databaseError({ code: '23505', message: 'duplicate key value violates unique constraint "pets_pkey"' })
    expect(e.message).toBe(OFFLINE)
  })
})

describe('photos', () => {
  it('tells where a photo lives from an older public link', () => {
    expect(isStoredPath('a0/1.jpg')).toBe(true)
    expect(isStoredPath('https://x.supabase.co/storage/v1/object/public/avatars/a0/pet-1.jpg')).toBe(false)
    expect(pathFromPublicLink('https://x.supabase.co/storage/v1/object/public/avatars/a0/pet%201.jpg')).toEqual({ bucket: 'avatars', path: 'a0/pet 1.jpg' })
    expect(pathFromPublicLink('https://elsewhere.example/cat.jpg')).toBeNull()
  })
  it('gives each photo a random name in the person’s own folder', () => {
    const a = newPhotoPath('user-1')
    const b = newPhotoPath('user-1')
    expect(a).toMatch(/^user-1\/[0-9a-f-]{36}\.jpg$/)
    expect(a).not.toBe(b)
  })
})
