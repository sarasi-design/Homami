import { describe, it } from 'vitest'

// The main journeys with a login. They need a separate Supabase project just for tests (decided with
// Sara: set up later), so they never touch real members. Until then they're listed here as the plan.
describe('Journeys with a login (need the test Supabase project)', () => {
  it.todo('signs up with a friend’s invite code and lands in their circle')
  it.todo('sets up a profile and adds a pet')
  it.todo('posts with a photo: someone in the circle sees it, a stranger can’t open the photo')
  it.todo('deletes a post, and its photo is gone too')
  it.todo('messages a pet sitter, who answers')
  it.todo('books a sitter and pays with a Stripe test card; the sitter accepts')
  it.todo('cancels a paid booking and gets the right amount back')
})
