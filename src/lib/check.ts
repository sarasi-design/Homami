import { z } from 'zod'

/**
 * Checks what comes back from Homami's database before the app uses it (with Zod).
 * The database already checks what goes in; this is the second half: if something unexpected ever comes back
 * (an older setup script, a half-saved row), the app says so clearly instead of breaking a page.
 *   one()       a single row: checked, or an error people can read
 *   maybeOne()  the same, when there may be nothing
 *   many()      a list: rows that don't look right are left out (and noted for us in the console),
 *               so one odd row never empties a whole page
 */

export const ODD_ANSWER = 'Something unexpected came back from Homami. Please try again.'

function note(what: string, error: z.ZodError) {
  console.warn(`Homami: ${what} didn’t look as expected`, z.flattenError(error))
}

export function one<T>(schema: z.ZodType<T>, data: unknown, what: string): T {
  const result = schema.safeParse(data)
  if (result.success) return result.data
  note(what, result.error)
  throw new Error(ODD_ANSWER)
}

export function maybeOne<T>(schema: z.ZodType<T>, data: unknown, what: string): T | null {
  return data === null || data === undefined ? null : one(schema, data, what)
}

export function many<T>(schema: z.ZodType<T>, data: unknown, what: string): T[] {
  if (data === null || data === undefined) return []
  if (!Array.isArray(data)) {
    console.warn(`Homami: ${what} wasn’t a list`)
    throw new Error(ODD_ANSWER)
  }
  const rows: T[] = []
  for (const row of data) {
    const result = schema.safeParse(row)
    if (result.success) rows.push(result.data)
    else note(what, result.error)
  }
  return rows
}

// Building blocks used by the schemas next to each kind of data (posts.ts, pets.ts…)

/** Text or nothing */
export const text = z.string().nullable()
/** Money columns come back from the database as text ("12.50"): numbers again, or nothing */
export const money = z.union([z.number(), z.string()]).nullable().transform((v) => (v === null ? null : Number(v)))
/** Someone's name, photo and city, joined to a row */
export const personBits = z.object({ first_name: text, avatar_url: text, city: text.optional() }).nullable()

/** Just where a photo lives, from a row that was removed */
export const photoOnly = z.object({ photo_url: text })
