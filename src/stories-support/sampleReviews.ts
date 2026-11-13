// Made-up reviews for Storybook examples.
import type { ReviewSummary, SitterReview } from '../lib/reviews'
import { sampleFace } from './sampleFaces'

const ago = (hours: number) => new Date(Date.now() - hours * 3600000).toISOString()

export const sampleSummary: ReviewSummary = {
  sitter_id: 'daniel',
  review_count: 14,
  rating_avg: 4.5,
  recommend_count: 13,
  known_recommenders: [
    { id: 'anna', first_name: 'Anna', avatar_url: sampleFace('Anna', 1), closeness: 1 },
    { id: 'marco', first_name: 'Marco', avatar_url: sampleFace('Marco', 2), closeness: 2 },
  ],
}

/** Reviews from people nobody you know: numbers only */
export const strangersSummary: ReviewSummary = { ...sampleSummary, review_count: 4, rating_avg: 5, recommend_count: 4, known_recommenders: [] }

export const sampleReviews: SitterReview[] = [
  {
    author_id: 'anna', first_name: 'Anna', city: 'Málaga', avatar_url: sampleFace('Anna', 1), closeness: 1, rating: 5, recommend: true, updated_at: ago(30),
    body: 'Daniel looked after Pablo, our gentle giant, for a whole week. He sent photos every evening and Pablo didn’t want him to leave!',
  },
  {
    author_id: 'marco', first_name: 'Marco', city: 'Marbella', avatar_url: sampleFace('Marco', 2), closeness: 2, rating: 4, recommend: true, updated_at: ago(80),
    body: 'Followed all of Max’s routines and kept us posted. Would book again.',
  },
  { author_id: 'lucia', first_name: 'Lucía', city: 'Fuengirola', avatar_url: null, closeness: 2, rating: 4, recommend: false, updated_at: ago(400), body: null },
]
