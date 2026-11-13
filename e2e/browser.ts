import { chromium } from 'playwright'
import type { Browser, Page, Route } from 'playwright'

export const APP = 'http://localhost:4173'

/** A phone-sized browser (375px wide, like the screens in Figma). CHROME_PATH can point at an installed Chrome. */
export async function openPhone(browser: Browser) {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, locale: 'en-GB' })
  const page = await context.newPage()
  const problems: string[] = []
  page.on('pageerror', (e) => problems.push(`page error: ${e.message}`))
  page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text()}`))
  return { page, problems }
}

export const launch = () => chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox'] })

type Fake = (route: Route, url: URL) => Promise<void> | void

/**
 * A stand-in for Supabase, so these tests never touch real accounts or data.
 * Each answer is picked by the address the app calls; anything else answers "not found".
 * `calls` lists what the app asked for, so a test can check something was NOT sent.
 */
export async function fakeSupabase(page: Page, answers: Record<string, Fake>) {
  const calls: string[] = []
  await page.route(/\.supabase\.co\//, async (route) => {
    const url = new URL(route.request().url())
    const key = `${route.request().method()} ${url.pathname}`
    calls.push(key)
    const answer = answers[key]
    if (answer) return answer(route, url)
    return route.fulfill({ status: 404, json: { message: 'not found in the test stand-in' } })
  })
  return calls
}

export const json = (status: number, body: unknown): Fake => (route) => route.fulfill({ status, json: body, headers: { 'Access-Control-Allow-Origin': '*' } })
