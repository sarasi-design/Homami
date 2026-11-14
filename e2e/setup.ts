import { existsSync } from 'node:fs'
import { serve } from './serve.ts'

export const PORT = 4173

/** Before the browser tests: serve the built app. Run `npm run build` first. */
export default async function setup() {
  if (!existsSync('dist/index.html')) throw new Error('Build the app first: npm run build')
  const server = await serve('dist', PORT)
  return () => new Promise<void>((resolve) => server.close(() => resolve()))
}
