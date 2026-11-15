import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser, Page } from 'playwright'
import { APP, launch } from './browser.ts'
import { DANI, LUNA, fakeHomami, loginAsSara } from './fake-homami.ts'

// Sara, logged in, on a phone: the main pages show what they should. Supabase is a pretend backend
// (fake-homami.ts), so no real account is used. Real journeys need the test Supabase project (journeys.e2e.ts).
let browser: Browser
beforeAll(async () => {
  browser = await launch()
})
afterAll(async () => {
  await browser?.close()
})

async function open(path: string, where?: { latitude: number; longitude: number }) {
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
    locale: 'en-GB',
    ...(where ? { geolocation: where, permissions: ['geolocation'] } : {}),
  })
  await loginAsSara(context)
  const page = await context.newPage()
  const problems: string[] = []
  page.on('pageerror', (e) => problems.push(e.message))
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && problems.push(m.text()))
  const backend = await fakeHomami(page)
  // OpenStreetMap: the town for a location, and no map pictures (they're not needed to test)
  const sentToMaps: string[] = []
  await page.route(/nominatim\.openstreetmap\.org/, (route) => {
    const url = route.request().url()
    sentToMaps.push(url)
    // Looking up a typed area (search) finds Torremolinos; finding the town for a location (reverse) says Málaga
    const json = url.includes('/search') ? [{ lat: '36.6218', lon: '-4.4997' }] : { address: { city: 'Málaga' } }
    return route.fulfill({ json, headers: { 'Access-Control-Allow-Origin': '*' } })
  })
  await page.route(/tile\.openstreetmap\.org/, (route) => route.abort())
  await page.goto(`${APP}/#${path}`)
  return { page, problems, backend, sentToMaps }
}

const text = (page: Page) => page.locator('body').innerText()

describe('Logged in as Sara', () => {
  it('Home: the wall with circle posts, their private photos, and a pet sitter', async () => {
    const { page, problems } = await open('/')
    await page.getByText('Rocky’s first beach day!').waitFor()
    const body = await text(page)
    expect(body).toContain('Luna found the sunny spot again')
    expect(body).toContain('Dani')
    const photo = page.locator('img[src*="/object/sign/post-photos/"]')
    await expect(photo.count()).resolves.toBe(1)
    expect(problems).toEqual([])
  })

  it('Home: the Sitters filter shows only pet sitters', async () => {
    const { page } = await open('/')
    await page.getByText('Rocky’s first beach day!').waitFor()
    await page.getByRole('radio', { name: 'Sitters' }).click()
    const body = await text(page)
    expect(body).toContain('Dani')
    expect(body).not.toContain('Rocky’s first beach day!')
  })

  it('Home: posting shows your post at the top of the wall straight away', async () => {
    const { page, problems } = await open('/')
    await page.getByText('Rocky’s first beach day!').waitFor()
    await page.getByText('What’s new?').click()
    await page.getByRole('dialog').getByRole('textbox').first().fill('Luna says hi')
    await page.getByRole('dialog').getByRole('button', { name: /post/i }).click()
    // Once the New post sheet has closed, the post shows once, on the wall
    await expect.poll(() => page.getByText('Luna says hi').count(), { timeout: 5000 }).toBe(1)
    await page.getByRole('dialog').waitFor({ state: 'hidden' })
    await expect(page.getByText('Luna says hi').count()).resolves.toBe(1)
    expect(problems).toEqual([])
  })

  it('Home: deleting your post asks first, then removes it', async () => {
    const { page } = await open('/')
    await page.getByText('Luna found the sunny spot again').waitFor()
    await page.getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('button', { name: /Yes, delete/ }).click()
    await page.getByText('Luna found the sunny spot again').waitFor({ state: 'detached' })
  })

  it('Home: the chosen filter is kept after visiting someone’s profile', async () => {
    const { page } = await open('/')
    await page.getByText('Rocky’s first beach day!').waitFor()
    await page.getByRole('radio', { name: 'Sitters' }).click()
    await page.getByText('Dani offers pet sitting').click()
    await page.getByText('Dog walker').waitFor()
    await page.goBack()
    await expect(page.getByRole('radio', { name: 'Sitters' }).getAttribute('aria-checked')).resolves.toBe('true')
  })

  it('Home: a new post shows straight away, faded with “Posting…”, until it’s saved', async () => {
    const { page, backend } = await open('/')
    await page.getByText('Rocky’s first beach day!').waitFor()
    backend.slowWrites = 1500
    await page.getByText('What’s new?').click()
    await page.getByRole('dialog').getByRole('textbox').first().fill('Saving slowly')
    await page.getByRole('dialog').getByRole('button', { name: /post/i }).click()
    // The sheet closes at once and the post is already there
    await page.locator('article[aria-busy="true"]').getByText('Saving slowly').waitFor({ timeout: 1000 })
    await page.getByText('Posting…').waitFor({ timeout: 1000 })
    // Then it's saved
    await page.getByText('Posting…').waitFor({ state: 'detached', timeout: 5000 })
    await expect(page.getByText('Saving slowly').count()).resolves.toBe(1)
  })

  it('Home: a post that doesn’t post says so, and Try again posts it', async () => {
    const { page, backend } = await open('/')
    await page.getByText('Rocky’s first beach day!').waitFor()
    backend.failWrites = true
    await page.getByText('What’s new?').click()
    await page.getByRole('dialog').getByRole('textbox').first().fill('No signal here')
    await page.getByRole('dialog').getByRole('button', { name: /post/i }).click()
    await page.getByRole('alert').getByText(/We couldn’t reach Homami/).waitFor()
    backend.failWrites = false
    await page.getByRole('button', { name: 'Try again' }).click()
    await page.getByRole('alert').waitFor({ state: 'detached' })
    await expect(page.getByText('No signal here').count()).resolves.toBe(1)
  })

  it('Home: a delete that doesn’t work brings the post back with a note', async () => {
    const { page, backend } = await open('/')
    await page.getByText('Luna found the sunny spot again').waitFor()
    backend.failWrites = true
    await page.getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('button', { name: /Yes, delete/ }).click()
    await page.getByRole('alert').getByText(/Not deleted/).waitFor()
    await page.getByText('Luna found the sunny spot again').waitFor()
    backend.failWrites = false
    await page.getByRole('button', { name: 'Try again' }).click()
    await page.getByText('Luna found the sunny spot again').waitFor({ state: 'detached' })
  })

  it('Your profile: name, city, Luna with her private photo, invite codes', async () => {
    const { page, problems } = await open('/profile')
    await page.getByText('Luna').first().waitFor()
    const body = await text(page)
    expect(body).toContain('Sara')
    expect(body).toContain('Málaga')
    await expect(page.locator('img[src*="/object/sign/pet-photos/"]').count()).resolves.toBeGreaterThan(0)
    expect(problems).toEqual([])
  })

  it('Circle: Bea is in your circle', async () => {
    const { page } = await open('/circle')
    await page.getByText('Bea').first().waitFor()
  })

  it('Chats: the chat with Dani, with a badge for the unread message', async () => {
    const { page, problems } = await open('/chats')
    await page.getByText('Hi Sara! I’m free next week.').waitFor()
    expect(await text(page)).toContain('Dani')
    expect(problems).toEqual([])
  })

  it('A chat: messages show, and what you send appears straight away', async () => {
    const { page } = await open(`/chats/${DANI}`)
    await page.getByText('Hi Sara! I’m free next week.').waitFor()
    await page.getByRole('textbox').fill('Great, Tuesday?')
    await page.keyboard.press('Enter')
    await page.getByText('Great, Tuesday?').waitFor()
  })

  it('Someone’s profile: a pet sitter you can message and book', async () => {
    const { page } = await open(`/people/${DANI}`)
    await page.getByText('Dog walker').waitFor()
    // The buttons show once their pet sitting has loaded
    await page.getByRole('button', { name: /Book/ }).first().waitFor()
    await page.getByRole('button', { name: /Message/ }).first().waitFor()
  })

  it('Home: a pet sitter card shows their hearts and who recommends them', async () => {
    const { page, problems } = await open('/')
    await page.getByText('Recommended by Bea and 2 more').waitFor()
    await page.getByRole('img', { name: /4\.7 out of 5 hearts/ }).first().waitFor()
    expect(problems).toEqual([])
  })

  it('Someone’s profile: their reviews from your circle, and Write a review after a finished booking', async () => {
    const { page, problems } = await open(`/people/${DANI}`)
    await page.getByText('Rocky adores him.').waitFor()
    await page.getByRole('button', { name: 'Write a review' }).waitFor()
    expect(problems).toEqual([])
  })

  it('Reviewing a pet sitter: hearts, recommend, a few words, then Share review sends it', async () => {
    const { page, problems, backend } = await open(`/review/${DANI}`)
    await page.getByRole('radio', { name: /^5 hearts/ }).check({ force: true })
    await page.getByText('Yes, I’d recommend Dani').click()
    await page.getByRole('textbox', { name: 'A few words' }).fill('Great with Luna')
    await page.getByRole('button', { name: 'Share review' }).click()
    await expect.poll(() => backend.calls.includes('POST /rest/v1/rpc/review_sitter')).toBe(true)
    expect(problems).toEqual([])
  })

  it('Your bookings: the finished walk with Dani is Done, with Review Dani', async () => {
    const { page } = await open('/bookings')
    await page.getByText('Done').first().waitFor()
    await page.getByRole('button', { name: /Review Dani/ }).waitFor()
  })

  // "Stay in exchange for care" is a test (Sara, Nov 14, 2026): picking it says Coming soon and counts the interest
  const comingSoon = async (page: Page, backend: { calls: string[] }) => {
    const sheet = page.getByRole('dialog', { name: /coming soon/i })
    await sheet.getByText('Stay in exchange for care').waitFor()
    await expect.poll(() => backend.calls.includes('POST /rest/v1/feature_interest')).toBe(true)
    await sheet.getByRole('button', { name: 'Got it' }).click()
    await sheet.waitFor({ state: 'hidden' })
  }

  it('Coming soon: Book → Stay in exchange for care', async () => {
    const { page, problems, backend } = await open(`/book/${DANI}`)
    await page.getByText('Stay in exchange for care').click()
    await comingSoon(page, backend)
    await expect(page.getByRole('radio', { name: /Stay in exchange for care/ }).isChecked()).resolves.toBe(false)
    expect(problems).toEqual([])
  })

  it('Coming soon: Create a request → Accommodation exchange', async () => {
    const { page, problems, backend } = await open('/requests/new')
    const tag = page.getByRole('button', { name: 'Accommodation exchange' })
    await tag.click()
    await comingSoon(page, backend)
    await expect(tag.getAttribute('aria-pressed')).resolves.toBe('false')
    expect(problems).toEqual([])
  })

  it('Coming soon: Set up pet sitter profile → the Stay in exchange for care switch', async () => {
    const { page, problems, backend } = await open('/sitter')
    await page.getByRole('switch', { name: /Stay in exchange for care/ }).click({ force: true })
    await comingSoon(page, backend)
    await expect(page.getByRole('switch', { name: /Stay in exchange for care/ }).isChecked()).resolves.toBe(false)
    expect(problems).toEqual([])
  })

  it('Homami team: ≡ → Homami team shows the numbers, who tapped Stay in exchange for care, and members’ emails', async () => {
    const { page, problems } = await open('/')
    await page.getByText('Rocky’s first beach day!').waitFor()
    await page.getByRole('button', { name: 'Menu' }).click()
    await page.getByRole('button', { name: 'Homami team' }).click()
    await page.getByRole('heading', { name: 'Homami team' }).waitFor()
    await page.getByText('+1 this week · +3 this month').waitFor()
    await page.getByText('bea@example.com').waitFor()
    await page.getByText('dani@example.com').waitFor()
    expect(problems).toEqual([])
  })

  it('Recommendations: Dani, recommended by Bea (your circle), leads the wall with “Recommended by Bea” on top', async () => {
    const { page, problems } = await open('/')
    await page.getByText('Rocky’s first beach day!').waitFor()
    await page.getByRole('radio', { name: 'Sitters' }).click()
    const card = page.getByRole('button', { name: /offers pet sitting/ }).first()
    await expect(card.innerText()).resolves.toMatch(/^\w?\s*Recommended by Bea[^]*Dani offers pet sitting/)
    await page.getByRole('button', { name: 'Invite them to Homami' }).waitFor() // bring your own sitter
    expect(problems).toEqual([])
  })

  it('Recommendations: “Dani is on Homami now” on Home → recommend him with Luna and a note', async () => {
    const { page, problems } = await open('/')
    await page.getByRole('button', { name: 'Recommend Dani' }).click()
    await page.getByText('Your name and photo will be shown on Dani’s page').waitFor()
    await page.getByRole('checkbox', { name: 'Luna' }).click()
    await page.getByLabel('A short note').fill('Looked after Luna for 3 weeks in August')
    const sent = page.waitForRequest((r) => r.url().endsWith('/rpc/recommend_sitter'))
    await page.getByRole('button', { name: 'Recommend Dani' }).click()
    expect((await sent).postDataJSON()).toEqual({ p_sitter: DANI, p_pet_ids: [LUNA], p_note: 'Looked after Luna for 3 weeks in August' })
    await page.waitForURL(`**/#/people/${DANI}`)
    expect(problems).toEqual([])
  })

  it('Recommendations: a sitter’s profile lists who recommends them, people you know first, with their pets', async () => {
    const { page } = await open(`/people/${DANI}`)
    await page.getByRole('heading', { name: 'Recommended by' }).waitFor()
    const body = await text(page)
    expect(body).toContain('Rocky’s favourite person.')
    expect(body).toContain('Looked after Rocky')
    expect(body).toContain('In your circle')
    await page.getByRole('button', { name: 'Recommend', exact: true }).click()
    await page.waitForURL(`**/#/recommend/${DANI}`)
  })

  it('Recommendations: opening a sitter’s link after signing up lands on what you came to do', async () => {
    const { page } = await open('/')
    await page.goto(`${APP}/?sitter=d4n1c0de99&do=recommend`)
    await page.waitForURL(`**/#/recommend/${DANI}`)
    await page.getByRole('heading', { name: 'Recommend Dani' }).waitFor()
    await expect(page.evaluate(() => window.location.search)).resolves.toBe('') // the link is used up
  })

  it('Your profile: “Already have a sitter you love?” opens Invite your sitter', async () => {
    const { page } = await open('/profile')
    await page.getByRole('button', { name: 'Invite them to Homami' }).click()
    await page.getByRole('heading', { name: 'Invite your sitter' }).waitFor()
  })

  it('Sitters near you: Use my location on Home → Sitters saves only a rough location, then shows how many are near', async () => {
    const { page, backend, sentToMaps, problems } = await open('/', { latitude: 36.721349, longitude: -4.421487 })
    await page.getByText('Rocky’s first beach day!').waitFor()
    await page.getByRole('radio', { name: 'Sitters' }).click()
    await page.getByText('See the pet sitters near you').waitFor()
    const saved = page.waitForRequest((r) => r.url().includes('/rpc/set_my_location'))
    await page.getByRole('button', { name: 'Use my location' }).click()
    expect((await saved).postDataJSON()).toEqual({ p_lat: 36.72, p_lng: -4.42 })
    await page.getByText('1 pet sitter near you').waitFor()
    // Only the rounded location goes to OpenStreetMap, never the exact one
    expect(sentToMaps.every((u) => u.includes('lat=36.72&lon=-4.42'))).toBe(true)
    expect(await text(page)).toContain('1 km away')
    expect(backend.calls).toContain('POST /rest/v1/rpc/sitters_near_me')
    expect(problems).toEqual([])
  })

  it('Sitters near you: the map shows Dani’s pin; tapping it shows his card, which opens his profile', async () => {
    const { page, problems } = await open('/sitters/map')
    await page.getByRole('heading', { name: 'Pet sitters near you' }).waitFor()
    await page.getByText('See who’s near you').waitFor()
    await page.locator('.leaflet-marker-icon[title="Dani"]').click()
    await page.getByRole('button', { name: /Dani offers pet sitting/ }).click()
    await page.waitForURL(new RegExp(`#/people/${DANI}$`))
    expect(problems).toEqual([])
  })

  it('Sitters near you: Remove my location on the map deletes your rough area', async () => {
    const { page } = await open('/sitters/map', { latitude: 36.72, longitude: -4.42 })
    await page.getByRole('button', { name: 'Use my location' }).click()
    await page.getByText('1 pet sitter near you').waitFor()
    const removed = page.waitForRequest((r) => r.method() === 'DELETE' && r.url().includes('/rest/v1/member_locations'))
    await page.getByRole('button', { name: 'Remove my location' }).click()
    expect((await removed).url()).toContain(`user_id=eq.`)
    await page.getByText('See who’s near you').waitFor()
  })

  it('Sitters near you: the pin in Ask for pet care fills in your town', async () => {
    const { page } = await open('/requests/new', { latitude: 36.72, longitude: -4.42 })
    const where = page.locator('#request-area')
    await where.fill('')
    await page.getByRole('button', { name: 'Use my location' }).click()
    await expect.poll(() => where.inputValue()).toBe('Málaga')
    await page.getByText(/1 pet sitter near you/).waitFor()
  })

  it('Pet sitter profile: a distance or price that is too big shows why, and Save waits until it’s fixed', async () => {
    const { page } = await open('/sitter')
    const saved: string[] = []
    page.on('request', (r) => r.url().includes('/rest/v1/sitter_profiles') && r.method() !== 'GET' && saved.push(r.postData() ?? ''))
    await page.getByRole('button', { name: /Dog walking/ }).first().click()
    await page.locator('#sitter-radius').fill('500')
    await page.getByText('Use a number from 1 to 200').waitFor()
    await page.getByRole('button', { name: 'Save' }).click()
    await page.locator('#sitter-radius').fill('20')
    await page.getByRole('button', { name: /Set price/ }).last().click()
    await page.getByPlaceholder(/Add your price per/).first().pressSequentially('99999')
    await page.getByText('Use a price up to 9,999 €').waitFor()
    await page.getByRole('button', { name: 'Save' }).click()
    await page.waitForTimeout(500)
    expect(saved).toEqual([])
    // Fixing it lets Save go ahead, with the right price
    await page.getByPlaceholder(/Add your price per/).first().fill('12')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect.poll(() => saved.length).toBe(1)
    expect(JSON.parse(saved[0])).toMatchObject({ radius_km: 20, walk_rate: 12 })
  })

  it('Pet sitter profile: saving a typed area moves your pin on the map there', async () => {
    const { page } = await open('/sitter')
    await page.getByRole('button', { name: /Dog walking/ }).first().click()
    await expect.poll(() => page.locator('#sitter-area').inputValue()).toBe('Málaga')
    await page.locator('#sitter-area').fill('Torremolinos')
    const moved = page.waitForRequest((r) => r.url().includes('/rpc/set_my_location'))
    await page.getByRole('button', { name: 'Save' }).click()
    expect((await moved).postDataJSON()).toEqual({ p_lat: 36.62, p_lng: -4.5 })
  })

  it('Your bookings and Payment details open', async () => {
    const bookings = await open('/bookings')
    await bookings.page.getByText(/bookings/i).first().waitFor()
    const payments = await open('/payments')
    await payments.page.getByText(/Payment details/i).first().waitFor()
  })
})
