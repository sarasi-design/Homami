/**
 * "Skip for now" on the first-pet step (or removing your last pet), and "Not now" on the
 * pet sitter step, are remembered on this phone so we don't keep asking.
 */
export type SkipWhat = 'pet' | 'sitter'

const skipKey = (what: SkipWhat, userId: string) => (what === 'pet' ? `homami:no-pet-yet:${userId}` : `homami:no-sitter-yet:${userId}`)

export function rememberedSkip(what: SkipWhat, userId: string) {
  try {
    return localStorage.getItem(skipKey(what, userId)) === '1'
  } catch {
    return false
  }
}

export function rememberSkip(what: SkipWhat, userId: string) {
  try {
    localStorage.setItem(skipKey(what, userId), '1')
  } catch {
    /* private mode: it just asks again next time */
  }
}
