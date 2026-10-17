import type { AuthError } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { SignUpValues } from '../screens/SignUp'
import type { LogInValues } from '../screens/LogIn'

/**
 * Sign up and log in, with every Supabase error turned into a sentence a person understands.
 * Each function throws an Error whose message is shown on the form.
 */

export const messages = {
  badInvite: 'That invitation code doesn’t work. Check it with the friend who invited you.',
  alreadyRegistered: 'There’s already a profile with this email. Try logging in instead.',
  wrongLogin: 'That email and password don’t match. Check them and try again.',
  notConfirmed: 'Please confirm your email first. We sent you a link when you signed up.',
  tooMany: 'Too many tries in a short time. Please wait a few minutes and try again.',
  offline: 'We couldn’t reach Homami. Check your connection and try again.',
  generic: 'Something went wrong on our side. Please try again.',
}

export function friendlyAuthError(error: Pick<AuthError, 'message'> & { code?: string; status?: number }): string {
  const code = error.code ?? ''
  const text = error.message ?? ''
  if (code === 'user_already_exists' || code === 'email_exists' || /already registered/i.test(text)) return messages.alreadyRegistered
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(text)) return messages.wrongLogin
  if (code === 'email_not_confirmed' || /email not confirmed/i.test(text)) return messages.notConfirmed
  if (code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit' || error.status === 429) return messages.tooMany
  // our sign-up rule in the database refused the code (Supabase reports it as a database error)
  if (/INVITE_INVALID|database error saving new user/i.test(text)) return messages.badInvite
  if (code === 'weak_password') return text
  if (/failed to fetch|network/i.test(text)) return messages.offline
  return messages.generic
}

export type SignUpResult = { status: 'signed-in' } | { status: 'check-email'; email: string }

export async function signUp({ email, password, inviteCode }: SignUpValues): Promise<SignUpResult> {
  // 1. Ask first whether the code is OK, so a typo gets a clear message
  const { data: ok, error: checkError } = await supabase.rpc('is_invite_code_valid', { invite: inviteCode })
  if (checkError) throw new Error(friendlyAuthError(checkError))
  if (!ok) throw new Error(messages.badInvite)

  // 2. Create the account. The database checks the code again and uses it up.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { invite_code: inviteCode }, emailRedirectTo: window.location.origin },
  })
  if (error) throw new Error(friendlyAuthError(error))
  // When email confirmation is on, Supabase hides "already registered" behind an empty user
  if (data.user && data.user.identities?.length === 0) throw new Error(messages.alreadyRegistered)
  return data.session ? { status: 'signed-in' } : { status: 'check-email', email }
}

export async function logIn({ email, password }: LogInValues) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(friendlyAuthError(error))
}

export async function logOut() {
  await supabase.auth.signOut()
}
