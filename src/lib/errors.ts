/**
 * What people read when something goes wrong talking to Homami's database: one place for every screen.
 */

export const OFFLINE = 'We couldn’t reach Homami. Check your connection and try again.'

export interface DatabaseError {
  code?: string
  message?: string
}

/** "Homami’s database needs an update for chat (setup script 09). Please try again later." */
export const needsUpdate = (what: string, scripts: string) =>
  `Homami’s database needs an update for ${what} (setup ${scripts}). Please try again later.`

/** The setup script that adds this table, column or function hasn't been run yet */
export function isMissingInDatabase(error: DatabaseError) {
  return (
    ['42P01', '42703', '42883', 'PGRST202', 'PGRST204', 'PGRST205'].includes(error.code ?? '') ||
    /relation .* does not exist|column .* does not exist|schema cache|Could not find the function/i.test(error.message ?? '')
  )
}

/** Homami's own database rules write some messages for people ("Add a card in Payment details first."): pass them on */
export const isMessageForPeople = (error: DatabaseError) => error.code === 'P0001' && !!error.message

/**
 * The error to show for a database problem: the update message when a setup script is missing (if one is given),
 * the database's own message when it wrote one for people, otherwise "We couldn't reach Homami".
 */
export function databaseError(error: DatabaseError, whenMissing?: string): Error {
  if (whenMissing && isMissingInDatabase(error)) return new Error(whenMissing)
  if (isMessageForPeople(error)) return new Error(error.message)
  return new Error(OFFLINE)
}
