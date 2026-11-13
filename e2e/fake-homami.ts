import { readFileSync } from 'node:fs'
import type { BrowserContext, Page } from 'playwright'

/**
 * A pretend Homami backend for browser tests with a login: a logged-in person and their world
 * (pets, circle, wall, chats…), answered from the lists below instead of the real Supabase.
 * Nothing is sent to the real Supabase: database, files and live updates are all stand-ins.
 */

const env = readFileSync('.env', 'utf8')
const supabaseUrl = env.match(/^VITE_SUPABASE_URL=(.+)$/m)?.[1]?.trim() ?? ''
const projectRef = new URL(supabaseUrl).hostname.split('.')[0]

export const ME = '5a5a5a5a-0000-4000-8000-000000000001'
export const BEA = 'beabeabe-0000-4000-8000-000000000002'
export const DANI = 'da1da1da-0000-4000-8000-000000000003'
export const LUNA = '1a1a1a1a-0000-4000-8000-000000000004'
const now = Date.now()
const ago = (minutes: number) => new Date(now - minutes * 60000).toISOString()
const day = (days: number) => new Date(now + days * 86400000).toISOString().slice(0, 10)

type Row = Record<string, unknown>

/** Each table's rows, as the app would get them (with the joined bits already filled in) */
export const world: { tables: Record<string, Row[]>; rpc: Record<string, unknown> } = {
  tables: {
    profiles: [
      { id: ME, first_name: 'Sara', city: 'Málaga', avatar_url: null, bio: 'Cat person', wants: 'care' },
      { id: BEA, first_name: 'Bea', city: 'Málaga', avatar_url: null, bio: null, wants: 'care' },
      { id: DANI, first_name: 'Dani', city: 'Málaga', avatar_url: null, bio: 'Dog walker', wants: 'offer' },
    ],
    pets: [{ id: LUNA, owner_id: ME, kind: 'cat', name: 'Luna', age: '3', description: 'Loves the sun', photo_url: `${ME}/luna.jpg` }],
    sitter_profiles: [
      {
        user_id: DANI, offers: ['dog_walking'], available_from: null, available_until: null, area: 'Centro', radius_km: 5, travels: true,
        daily_rate: '20', overnight_rate: null, walk_rate: '9.5', stay_for_care: false, sitting_exchange: false,
        profile: { first_name: 'Dani', city: 'Málaga', avatar_url: null },
      },
    ],
    posts: [
      {
        id: 'p0000000-0000-4000-8000-000000000001', author_id: BEA, body: 'Rocky’s first beach day!', photo_url: `${BEA}/beach.jpg`, created_at: ago(30),
        author: { first_name: 'Bea', avatar_url: null, city: 'Málaga' }, pet: { name: 'Rocky', kind: 'dog' },
      },
      {
        id: 'p0000000-0000-4000-8000-000000000002', author_id: ME, body: 'Luna found the sunny spot again', photo_url: null, created_at: ago(120),
        author: { first_name: 'Sara', avatar_url: null, city: 'Málaga' }, pet: { name: 'Luna', kind: 'cat' },
      },
    ],
    care_requests: [],
    bookings: [],
    payment_profiles: [],
    invite_codes: [{ code: 'SARA42', created_by: ME, note: 'personal', uses: 0, expires_at: null, created_at: ago(1000) }],
    messages: [
      { id: 'm0000000-0000-4000-8000-000000000001', sender_id: DANI, recipient_id: ME, body: 'Hi Sara! I’m free next week.', created_at: ago(10), read_at: null },
    ],
  },
  rpc: {
    my_circle: [{ id: BEA, first_name: 'Bea', city: 'Málaga', avatar_url: null, shared_count: 0 }],
    my_extended_circle: [],
    my_chats: [{ other_id: DANI, first_name: 'Dani', avatar_url: null, last_body: 'Hi Sara! I’m free next week.', last_at: ago(10), last_from_me: false, unread: 1 }],
    can_be_paid: false,
    mark_chat_read: null,
  },
}

/** A login that looks real to the app (it's never checked by a server here) */
function session() {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const exp = Math.floor(now / 1000) + 3600
  const token = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: ME, exp, role: 'authenticated', aud: 'authenticated' })}.fake`
  const user = { id: ME, aud: 'authenticated', role: 'authenticated', email: 'sara@example.com', app_metadata: {}, user_metadata: {}, created_at: ago(5000) }
  return { access_token: token, token_type: 'bearer', expires_in: 3600, expires_at: exp, refresh_token: 'fake', user }
}

/** Applies PostgREST-style filters from the address (id=eq.x, owner_id=neq.y), and ignores the rest */
function filterRows(rows: Row[], params: URLSearchParams) {
  return rows.filter((row) =>
    [...params.entries()].every(([key, value]) => {
      if (['select', 'order', 'limit', 'offset'].includes(key)) return true
      const [op, ...rest] = value.split('.')
      const target = rest.join('.')
      if (op === 'eq') return String(row[key]) === target
      if (op === 'neq') return String(row[key]) !== target
      return true // gte, lte… : keep everything
    }),
  )
}

// A 1×1 picture for photos
const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64')

/** Log in as Sara before the app starts, and answer every call to Supabase from `world` */
export async function loginAsSara(context: BrowserContext) {
  await context.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [`sb-${projectRef}-auth-token`, JSON.stringify(session())] as const,
  )
}

export async function fakeHomami(page: Page) {
  const calls: string[] = []
  // Each page gets its own copy, so what one test adds or deletes never leaks into another
  const tables: Record<string, Row[]> = structuredClone(world.tables)
  // Live updates: accept the connection and stay quiet
  await page.routeWebSocket(/supabase\.co/, () => {})
  await page.route(/supabase\.co\//, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const method = request.method()
    calls.push(`${method} ${url.pathname}`)
    const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' }
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers })

    // Photos: private links, and the pictures themselves
    const sign = url.pathname.match(/^\/storage\/v1\/object\/sign\/([^/]+)$/)
    if (sign && method === 'POST') {
      const { paths } = request.postDataJSON() as { paths: string[] }
      return route.fulfill({ headers, json: paths.map((path) => ({ path, signedURL: `/object/sign/${sign[1]}/${path}?token=fake`, error: null })) })
    }
    if (url.pathname.startsWith('/storage/v1/object/')) return route.fulfill({ headers, contentType: 'image/png', body: pixel })

    if (url.pathname === '/auth/v1/user') return route.fulfill({ headers, json: session().user })
    if (url.pathname === '/auth/v1/logout') return route.fulfill({ status: 204, headers })

    const rpc = url.pathname.match(/^\/rest\/v1\/rpc\/(.+)$/)
    if (rpc) return route.fulfill({ headers, json: world.rpc[rpc[1]] ?? null })

    const table = url.pathname.match(/^\/rest\/v1\/(.+)$/)?.[1]
    if (table && method === 'GET') {
      const rows = filterRows(tables[table] ?? [], url.searchParams)
      const wantsOne = (request.headers()['accept'] ?? '').includes('vnd.pgrst.object')
      if (!wantsOne) return route.fulfill({ headers, json: rows })
      if (rows.length === 1) return route.fulfill({ headers, json: rows[0] })
      return route.fulfill({ status: 406, headers, json: { code: 'PGRST116', message: 'The result contains 0 rows', details: null, hint: null } })
    }
    const wantsOne = (request.headers()['accept'] ?? '').includes('vnd.pgrst.object')
    const answer = (rows: Row[]) => route.fulfill({ status: method === 'POST' ? 201 : 200, headers, json: wantsOne ? (rows[0] ?? null) : rows })

    // Deleting: remove the matching rows, and send them back
    if (table && method === 'DELETE') {
      const gone = filterRows(tables[table] ?? [], url.searchParams)
      tables[table] = (tables[table] ?? []).filter((row) => !gone.includes(row))
      return answer(gone)
    }
    // Adding: remember the row, filled in like the database does (id, time, and who wrote it)
    if (table && method === 'POST') {
      const sent = (request.postDataJSON() ?? {}) as Row | Row[]
      const me = tables.profiles.find((p) => p.id === ME)
      const saved = (row: Row): Row => ({
        id: crypto.randomUUID(), created_at: new Date().toISOString(), read_at: null, owner_id: ME, author_id: ME,
        ...(table === 'posts' ? { author: { first_name: me?.first_name, avatar_url: null, city: me?.city }, pet: null } : {}),
        ...row,
      })
      const rows = (Array.isArray(sent) ? sent : [sent]).map(saved)
      tables[table] = [...rows, ...(tables[table] ?? [])]
      return answer(rows)
    }
    // Anything else that changes data: say it worked
    return answer([])
  })
  return calls
}

export const days = { day }
