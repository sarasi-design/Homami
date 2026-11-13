import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { HeartRating } from '../basics/HeartRating'
import { RecommendedBy } from './RecommendedBy'
import { ReviewCard, ReviewSummary } from './ReviewCard'
import { SitterPostCard } from './SitterPostCard'
import { closenessLabel, recommendedByLabel, whenLabel } from '../../lib/reviews'
import { sampleFace } from '../../stories-support/sampleFaces'
import { sampleReviews, sampleSummary, strangersSummary } from '../../stories-support/sampleReviews'

const meta: Meta = {
  title: 'Blocks/Reviews',
  parameters: { options: { showPanel: false } },
  decorators: [(Story) => <div className="w-[361px] bg-surface"><Story /></div>],
}
export default meta

const figma = (node: string) => ({ design: { type: 'figma', url: `https://www.figma.com/design/SyIrJ3CngOXOHcBvhMSi8Q/Homami-app-v0?node-id=${node}` } })
const people = sampleSummary.known_recommenders.map((p) => ({ name: p.first_name ?? '', photoUrl: p.avatar_url }))

/** Homami's stars: Dark sage hearts, Soft sage when empty, halves for averages. */
export const Hearts: StoryObj = {
  name: 'Hearts',
  parameters: figma('53-4182'),
  render: () => (
    <div className="flex flex-col gap-m">
      <HeartRating value={4} />
      <HeartRating value={4.5} size="medium" />
      <HeartRating value={3} size="large" />
    </div>
  ),
}

function PickerDemo() {
  const [v, setV] = useState(0)
  return <HeartRating value={v} onChange={setV} label="How was it?" />
}
/** Picking hearts on Review a sitter: 44px taps, arrow keys, and a word for each ("Wonderful"). */
export const HeartsPicker: StoryObj = { name: 'Hearts, picking', render: () => <PickerDemo /> }

/** People you know come first, with their faces. */
export const Recommended: StoryObj = {
  name: 'Recommended by',
  render: () => (
    <div className="flex flex-col gap-m">
      <RecommendedBy label={recommendedByLabel(sampleSummary)!} people={people} />
      <RecommendedBy label={recommendedByLabel({ recommend_count: 2, known_recommenders: sampleSummary.known_recommenders })!} people={people} />
      <RecommendedBy label={recommendedByLabel(strangersSummary)!} people={[]} />
    </div>
  ),
}

/** Figma "total reviews" (134:17570), with how many people recommend them. */
export const Summary: StoryObj = {
  name: 'Reviews summary',
  parameters: figma('134-17152'),
  render: () => (
    <ReviewSummary
      ratingAvg={4.5}
      reviewCount={11}
      recommended={<span className="text-label text-dark-sage">11 people recommend Daniel</span>}
    />
  ),
}

/** Figma "review--card" (53:4182). With words, and with hearts only. */
export const Cards: StoryObj = {
  name: 'Review cards',
  parameters: figma('53-4182'),
  render: () => (
    <div className="flex flex-col">
      {sampleReviews.map((r) => (
        <ReviewCard
          key={r.author_id}
          name={r.first_name ?? ''}
          photoUrl={r.avatar_url}
          relation={closenessLabel(r.closeness)}
          when={whenLabel(r.updated_at)}
          city={r.city}
          rating={r.rating}
          recommends={r.recommend ? 'Daniel' : undefined}
          body={r.body}
        />
      ))}
    </div>
  ),
}

/** A sitter on the wall once people have reviewed them. */
export const SitterCardReviewed: StoryObj = {
  name: 'Sitter card with reviews',
  render: () => (
    <div className="flex flex-col gap-l">
      <SitterPostCard
        name="Daniel"
        photoUrl={sampleFace('Daniel Medina')}
        relation="In your extended circle"
        availability="Available now"
        offers={['live_in', 'dog_walking']}
        price="From 9 €"
        rating={{ avg: 4.5, count: 11 }}
        recommended={{ label: recommendedByLabel(sampleSummary)!, people }}
        onOpen={() => {}}
      />
      <SitterPostCard
        name="Vera"
        photoUrl={sampleFace('Vera Rodrigues')}
        relation="Near you · Málaga"
        availability="Available from 3 Dec"
        offers={['boarding']}
        price="From 20 €"
        rating={{ avg: 5, count: 4 }}
        recommended={{ label: recommendedByLabel(strangersSummary)!, people: [] }}
        onOpen={() => {}}
      />
    </div>
  ),
}
