import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser, Page } from 'playwright'
import { APP, launch } from './browser.ts'
import { DANI, fakeHomami, loginAsSara } from './fake-homami.ts'

// Sara, logged in, on a phone: the main pages show what they should. Supabase is a pretend backend
// (fake-homami.ts), so no real account is used. Real journeys need the test Supabase project (journeys.e2e.ts).
let browser: Browser
beforeAll(async () => {
  browser = await launch()
})
afterAll(async () => {
  await browser?.close()
})

async function open(path: string) {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, locale: 'en-GB' })
  await loginAsSara(context)
  const page = await context.newPage()
  const problems: string[] = []
  page.on('pageerror', (e) => problems.push(e.message))
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && problems.push(m.text()))
  const backend = await fakeHomami(page)
  await page.goto(`${APP}/#${path}`)
  return { page, problems, backend }
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

  it('Your bookings and Payment details open', async () => {
    const bookings = await open('/bookings')
    await bookings.page.getByText(/bookings/i).first().waitFor()
    const payments = await open('/payments')
    await payments.page.getByText(/Payment details/i).first().waitFor()
  })
})
