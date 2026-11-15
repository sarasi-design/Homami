// Made-up recommendations for Storybook examples.
import type { PublicSitterPage, Recommendation } from '../lib/recommendations'
import { sampleFace } from './sampleFaces'

const ago = (hours: number) => new Date(Date.now() - hours * 3600000).toISOString()

export const sampleRecommendations: Recommendation[] = [
  {
    author_id: 'anna', first_name: 'Anna', avatar_url: sampleFace('Anna', 1), closeness: 1, pet_names: ['Luna', 'Milo'],
    note: 'Looked after Luna and Milo for 3 weeks in August. Photos every evening, and the plants survived too!', created_at: ago(30), updated_at: ago(30),
  },
  {
    author_id: 'francesca', first_name: 'Francesca', avatar_url: sampleFace('Francesca', 3), closeness: 2, pet_names: ['Pepe'],
    note: 'Our old boy Pepe needs pills twice a day. Never missed one.', created_at: ago(200), updated_at: ago(200),
  },
  { author_id: 'tom', first_name: 'Tom', avatar_url: null, closeness: 3, pet_names: [], note: null, created_at: ago(900), updated_at: ago(900) },
]

export const samplePublicPage: PublicSitterPage = {
  id: 'daniel',
  first_name: 'Daniel',
  avatar_url: sampleFace('Daniel', 4),
  city: 'Málaga',
  bio: 'Retired teacher, lifelong cat person. I stay in your home so your pets keep their routine.',
  sitter: {
    offers: ['live_in', 'dog_walking'],
    available_from: null,
    available_until: null,
    area: 'Málaga Centro',
    radius_km: 15,
    travels: true,
    daily_rate: 25,
    overnight_rate: 40,
    walk_rate: 12,
    stay_for_care: false,
    sitting_exchange: false,
  },
  recommendations: sampleRecommendations.map((r) => ({ first_name: r.first_name, avatar_url: r.avatar_url, note: r.note, created_at: r.created_at })),
  recommend_count: 3,
}
