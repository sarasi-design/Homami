import type { Meta, StoryObj } from '@storybook/react-vite'
import { TeamPage } from './TeamPage'

const meta: Meta<typeof TeamPage> = {
  title: 'Screens/Homami team',
  component: TeamPage,
  // Not in Figma yet (Sara, Nov 14, 2026)
  parameters: { layout: 'fullscreen' },
  args: { onBack: () => {}, onOpenPerson: () => {} },
}
export default meta

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString()

export const Default: StoryObj<typeof TeamPage> = {
  name: 'Homami team',
  args: {
    overview: {
      members: 24, members_7_days: 3, members_30_days: 11, sitters: 6, pets: 19, posts: 42, care_requests: 5,
      bookings: 9, bookings_accepted: 6, bookings_paid: 2, reviews: 4,
      interest: [
        { place: 'book', taps: 4, people: 3 },
        { place: 'care_request', taps: 2, people: 2 },
        { place: 'sitter_setup', taps: 7, people: 5 },
      ],
      interest_people: 8,
    },
    taps: [
      { user_id: 'a', first_name: 'Anna', email: 'anna@example.com', place: 'book', tapped_at: hoursAgo(2) },
      { user_id: 'b', first_name: 'Marco', email: 'marco@example.com', place: 'sitter_setup', tapped_at: hoursAgo(30) },
    ],
    members: [
      { id: 'a', first_name: 'Anna', email: 'anna@example.com', city: 'Málaga', wants: 'both', joined_at: hoursAgo(20), last_sign_in_at: hoursAgo(2), invited_by_name: 'Sara', offers_care: true, pet_count: 2 },
      { id: 'b', first_name: null, email: 'new.member@example.com', city: null, wants: null, joined_at: hoursAgo(1), last_sign_in_at: null, invited_by_name: null, offers_care: false, pet_count: 0 },
    ],
  },
}

export const NotOnTheTeam: StoryObj<typeof TeamPage> = { name: 'Not on the team', args: { error: 'This page is only for the Homami team.' } }
