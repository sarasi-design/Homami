import type { Meta, StoryObj } from '@storybook/react-vite'
import { RecommendationCard } from './RecommendationCard'
import { SitterPostCard } from './SitterPostCard'
import { InviteLinkCard } from './InviteLinkCard'
import { petsLine, recRelation, sitterShareText } from '../../lib/recommendations'
import { whenLabel } from '../../lib/reviews'
import { sampleFace } from '../../stories-support/sampleFaces'
import { sampleRecommendations } from '../../stories-support/sampleRecommendations'

const meta: Meta = {
  title: 'Blocks/Recommendations',
  parameters: { options: { showPanel: false } },
  decorators: [(Story) => <div className="w-[361px] bg-surface"><Story /></div>],
}
export default meta

// Figma Chat+book (140:6880) has the Endorse and Share steps, without screens yet
const figma = (node: string) => ({ design: { type: 'figma', url: `https://www.figma.com/design/SyIrJ3CngOXOHcBvhMSi8Q/Homami-app-v0?node-id=${node}` } })

/** One recommendation: who, how you know them, which pets, and their note. Members see the pets; the public page doesn't. */
export const Cards: StoryObj = {
  name: 'Recommendation cards',
  parameters: figma('140-6897'),
  render: () => (
    <div className="flex flex-col">
      {sampleRecommendations.map((r) => (
        <RecommendationCard
          key={r.author_id}
          name={r.first_name ?? 'Homami member'}
          photoUrl={r.avatar_url}
          relation={recRelation(r.closeness)}
          when={whenLabel(r.updated_at)}
          pets={petsLine(r.pet_names)}
          note={r.note}
        />
      ))}
    </div>
  ),
}

/** On the wall: recommended by your circle, so "Recommended by Anna" leads the card and it comes first. */
export const OnTheWall: StoryObj = {
  name: 'Sitter card, recommended by your circle',
  parameters: figma('134-17763'),
  render: () => (
    <SitterPostCard
      name="Daniel"
      photoUrl={sampleFace('Daniel', 4)}
      relation="Near you · Málaga"
      availability="Available now"
      offers={['live_in', 'dog_walking']}
      price="From 12 €"
      recommended={{ label: 'Recommended by Anna and 2 more', people: [{ name: 'Anna', photoUrl: sampleFace('Anna', 1) }] }}
      recommendedFirst
    />
  ),
}

/** A pet sitter's own link, with the message that goes with it (Share). */
export const ShareLink: StoryObj = {
  name: 'Your page link',
  parameters: figma('140-6899'),
  render: () => <InviteLinkCard title="Your page link" link="https://homami-sepia.vercel.app/?sitter=3f9a2c7b1e" shareText={sitterShareText('Daniel')} />,
}
