import { describe, expect, it } from 'vitest'
import { dateRangeLabel } from './requests'
import { chatDay, chatTime } from './chat'
import { timeAgo } from './posts'
import { formatAge } from './pets'
import { codeFromInput } from './circle'
import { friendlyAuthError, messages } from './auth'

// Dates and words people read on screen. Tests run in Spain's time zone (see the "test" script).
describe('dates', () => {
  it('writes date ranges the short way', () => {
    expect(dateRangeLabel('2026-09-03', '2026-09-03')).toBe('3 September 2026')
    expect(dateRangeLabel('2026-09-01', '2026-09-07')).toBe('1 to 7 September 2026')
    expect(dateRangeLabel('2026-08-30', '2026-09-02')).toBe('30 August to 2 September 2026')
    expect(dateRangeLabel('2026-12-30', '2027-01-02')).toBe('30 December 2026 to 2 January 2027')
  })

  const now = new Date('2026-11-13T10:00:00')
  it('says how long ago something was posted', () => {
    expect(timeAgo('2026-11-13T09:59:40', now)).toBe('Just now')
    expect(timeAgo('2026-11-13T09:55:00', now)).toBe('5 min ago')
    expect(timeAgo('2026-11-13T07:00:00', now)).toBe('3h ago')
    expect(timeAgo('2026-11-12T09:00:00', now)).toBe('Yesterday')
    expect(timeAgo('2026-11-10T09:00:00', now)).toBe('3 days ago')
  })

  it('labels chats by time, day or date', () => {
    expect(chatTime('2026-11-13T08:05:00', now)).toBe('08:05')
    expect(chatTime('2026-11-12T22:00:00', now)).toBe('Yesterday')
    expect(chatTime('2026-11-10T12:00:00', now)).toBe('Tue')
    expect(chatTime('2026-10-12T12:00:00', now)).toBe('12 Oct')
    expect(chatDay('2026-11-13T08:00:00', now)).toBe('Today')
    expect(chatDay('2026-10-26T08:00:00', now)).toBe('Monday 26 October')
  })
})

describe('text people type', () => {
  it('tidies a pet’s age', () => {
    expect(formatAge('1')).toBe('1 year old')
    expect(formatAge('6')).toBe('6 years old')
    expect(formatAge('6years old')).toBe('6 years old')
    expect(formatAge('8 months')).toBe('8 months')
    expect(formatAge(null)).toBeNull()
  })
  it('keeps just the code when a whole invite link is pasted', () => {
    expect(codeFromInput('https://homami-sepia.vercel.app/?invite=abc123')).toBe('ABC123')
    expect(codeFromInput('  welcome-homami ')).toBe('WELCOME-HOMAMI')
  })
})

describe('login messages', () => {
  it('turns Supabase errors into sentences people understand', () => {
    expect(friendlyAuthError({ message: 'Invalid login credentials', code: 'invalid_credentials' })).toBe(messages.wrongLogin)
    expect(friendlyAuthError({ message: 'x', code: 'user_already_exists' })).toBe(messages.alreadyRegistered)
    expect(friendlyAuthError({ message: 'Database error saving new user' })).toBe(messages.badInvite)
    expect(friendlyAuthError({ message: 'x', status: 429 })).toBe(messages.tooMany)
    expect(friendlyAuthError({ message: 'Failed to fetch' })).toBe(messages.offline)
    expect(friendlyAuthError({ message: 'something odd' })).toBe(messages.generic)
  })
  it('never says whether an email has a profile when the password is wrong', () => {
    expect(messages.wrongLogin).not.toMatch(/no (account|profile)|not found/i)
  })
})
