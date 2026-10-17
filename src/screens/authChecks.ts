/** The checks Sign up and Log in run before sending anything. Messages are written for people, not developers. */

export const MIN_PASSWORD = 8

export function checkEmail(email: string): string | undefined {
  const trimmed = email.trim()
  if (!trimmed) return 'Add your email'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) return 'This email doesn’t look right. Try name@example.com'
}

/** For a new password: it has to be long enough. */
export function checkNewPassword(password: string): string | undefined {
  if (!password) return 'Add a password'
  if (password.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters`
}

/** Sign up is invite-only for now. Whether the code is real is checked by the server later. */
export function checkInviteCode(code: string): string | undefined {
  if (!code.trim()) return 'You need an invitation code to join. Ask the friend who invited you.'
}

/** Puts the cursor in the first field that needs fixing. */
export function focusFirst(errors: Record<string, string | undefined>, idFor: Record<string, string>) {
  const first = Object.keys(idFor).find((key) => errors[key])
  if (first) document.getElementById(idFor[first])?.focus()
}
