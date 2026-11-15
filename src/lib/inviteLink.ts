/** Where friends open Homami. Shared links (invites, a sitter's page) always point here, even when you copy yours
 *  from the app on your own computer (localhost), which nobody else can open. VITE_SITE_URL can change it. */
export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? 'https://homami-sepia.vercel.app').replace(/\/$/, '')

const onThisComputer = () => /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)

/** The address to put in links you share */
export const siteOrigin = () => (onThisComputer() ? SITE_URL : window.location.origin)

/** An invite link looks like https://…/?invite=LUNA42: the code in it, if there is one */
export function inviteFromLink(): string | null {
  return new URLSearchParams(window.location.search).get('invite')
}

/** Takes the invite out of the address once it's been answered, so reloading doesn't ask again */
export function clearInviteFromLink() {
  const url = new URL(window.location.href)
  url.searchParams.delete('invite')
  window.history.replaceState(null, '', url.pathname + url.search + url.hash)
}

/** Someone may paste a whole invite link into the code field: keep just the code */
export function codeFromInput(value: string) {
  const match = value.match(/[?&]invite=([^&#\s]+)/i)
  return (match ? decodeURIComponent(match[1]) : value).trim().toUpperCase()
}
