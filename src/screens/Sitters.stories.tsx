import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { PersonPage } from './CircleScreens'
import { HowWillYouUse } from './HowWillYouUse'
import { SitterSetup } from './SitterSetup'
import { MyProfile } from './MyProfile'
import { sampleFace } from '../stories-support/sampleFaces'
import { sampleSitter } from '../stories-support/sampleSitter'
import { sampleReviews, sampleSummary, strangersSummary } from '../stories-support/sampleReviews'
import { sampleRecommendations } from '../stories-support/sampleRecommendations'
import { sitterShareText } from '../lib/recommendations'

const meta: Meta = {
  title: 'Screens/Pet sitting',
  parameters: { layout: 'centered', options: { showPanel: false } },
  decorators: [
    (Story) => (
      <div className="relative h-[852px] w-[393px] overflow-y-auto rounded-[20px] border border-soft-grey bg-surface [transform:translateZ(0)] [&>div]:min-h-full [&>main]:min-h-full">
        <Story />
      </div>
    ),
  ],
}
export default meta

const wait = () => new Promise<void>((r) => setTimeout(r, 1200))

/** Figma 85:10906. Right after "Let's set up your profile". */
export const HowWillYou: StoryObj = {
  name: '1. How will you use Homami?',
  render: () => <HowWillYouUse onSubmit={wait} />,
  parameters: { design: { type: 'figma', url: 'https://www.figma.com/design/SyIrJ3CngOXOHcBvhMSi8Q/Homami-app-v0?node-id=85-10906' } },
}

/**
 * Figma "USER OFFERS PET SITTING" (85:10659 → 91:10326), on one page. Only "What you offer" is needed.
 * Where you offer pet sitting (Nov 15, 2026): already filled in with the city from your profile; the pin puts you on the map.
 */
export const Setup: StoryObj = {
  name: '2. Set up pet sitter profile',
  render: () => <SitterSetup onSubmit={wait} onSkip={() => {}} defaultArea="Málaga" onLocate={async () => ({ place: 'Málaga' })} />,
  parameters: { design: { type: 'figma', url: 'https://www.figma.com/design/SyIrJ3CngOXOHcBvhMSi8Q/Homami-app-v0?node-id=91-10326' } },
}

/** A distance over 200 km, or a price over 9,999 €: each says why, and Save waits until it's fixed (Nov 15, 2026). */
export const SetupTooBig: StoryObj = {
  name: '2. Set up pet sitter profile: numbers too big',
  render: () => <SitterSetup onSubmit={wait} onSkip={() => {}} defaultArea="Málaga" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByPlaceholderText('How far you’ll go'), '500')
    await expect(canvas.getByText('Use a number from 1 to 200')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Set price for Dog walking' }))
    await userEvent.type(canvas.getByPlaceholderText('Add your price per hour'), '99999')
    await expect(canvas.getByText('Use a price up to 9,999 €')).toBeVisible()
  },
}

/** Editing it later, from Your profile. */
export const Edit: StoryObj = {
  name: '2. Your pet sitter profile (edit)',
  render: () => <SitterSetup mode="edit" initial={sampleSitter} onBack={() => {}} onSubmit={wait} onRemove={wait} />,
}

/** Your profile when you offer pet sitting: status tag under your name and the Offers section. */
export const ProfileAsSitter: StoryObj = {
  name: '3. Your profile as a sitter',
  render: () => (
    <MyProfile
      name="Sara"
      photoUrl={sampleFace('Sara')}
      city="Málaga"
      bio="Two cats, one very opinionated dog."
      pets={[{ id: '1', name: 'Buddy', kindLabel: 'Dog', ageLabel: '9 years old' }]}
      sitter={{ user_id: 'me', ...sampleSitter }}
      onSitter={() => {}}
      onBack={() => {}}
    />
  ),
}

/** Your profile before offering pet sitting: a banner to add services. */
export const ProfileNotSitter: StoryObj = {
  name: '3. Your profile, not a sitter yet',
  render: () => (
    <MyProfile name="Sara" photoUrl={sampleFace('Sara')} city="Málaga" pets={[{ id: '1', name: 'Buddy', kindLabel: 'Dog', ageLabel: '9 years old' }]} sitter={null} onSitter={() => {}} onBack={() => {}} />
  ),
}

/** A sitter you don't know yet: their profile and offers (not their pets), and Message. */
export const SitterPage: StoryObj = {
  name: '5. A pet sitter’s profile',
  render: () => (
    <PersonPage
      person={{ name: 'Daniel Medina', photoUrl: sampleFace('Daniel Medina'), city: 'Málaga', bio: 'I’m a dedicated pet sitter and animal lover who works from home.' }}
      pets={null}
      sitter={{ user_id: 'd', ...sampleSitter }}
      onBack={() => {}}
      onMessage={() => {}}
    />
  ),
}

const daniel = { name: 'Daniel', photoUrl: sampleFace('Daniel Medina'), city: 'Málaga', bio: 'I’m a dedicated pet sitter and animal lover who works from home.' }

/** Figma "Reviews" (134:17152): "Recommended by Anna, Marco and 9 more" under the name, then the hearts and reviews
 *  from people you know. Reviews from strangers only count in the numbers. */
export const SitterPageReviewed: StoryObj = {
  name: '5. A pet sitter’s profile, with reviews',
  parameters: { design: { type: 'figma', url: 'https://www.figma.com/design/SyIrJ3CngOXOHcBvhMSi8Q/Homami-app-v0?node-id=134-17152' } },
  render: () => (
    <PersonPage
      person={daniel}
      pets={null}
      sitter={{ user_id: 'd', ...sampleSitter }}
      reviewSummary={sampleSummary}
      reviews={sampleReviews}
      review={{ label: 'Write a review', onClick: () => {} }}
      onBack={() => {}}
      onBook={() => {}}
      onMessage={() => {}}
    />
  ),
}

/** Only strangers have reviewed them: the numbers, and why you can't read the words. */
export const SitterPageStrangers: StoryObj = {
  name: '5. A pet sitter’s profile, reviews from strangers',
  render: () => (
    <PersonPage person={daniel} pets={null} sitter={{ user_id: 'd', ...sampleSitter }} reviewSummary={strangersSummary} reviews={[]} onBack={() => {}} onBook={() => {}} />
  ),
}

/** Recommendations (Sara, Nov 15, 2026; Endorse in Figma Chat+book 140:6880): "Recommend" next to Message,
 *  and who recommended them, people you know first, with their pets and notes. */
export const SitterPageRecommended: StoryObj = {
  name: '5. A pet sitter’s profile, with recommendations',
  parameters: { design: { type: 'figma', url: 'https://www.figma.com/design/SyIrJ3CngOXOHcBvhMSi8Q/Homami-app-v0?node-id=140-6880' } },
  render: () => (
    <PersonPage
      person={daniel}
      pets={null}
      sitter={{ user_id: 'd', ...sampleSitter }}
      reviewSummary={{ ...sampleSummary, review_count: 0, recommend_count: 3 }}
      reviews={[]}
      recommendations={sampleRecommendations}
      recommend={{ label: 'Recommend', onClick: () => {}, done: false }}
      onBack={() => {}}
      onMessage={() => {}}
    />
  ),
}

/** Your profile as a sitter with no recommendations yet: "Ask your clients to recommend you" and your page's link. */
export const ProfileAsSitterNoRecs: StoryObj = {
  name: '3. Your profile as a sitter, asking for recommendations',
  render: () => (
    <MyProfile
      name="Sara"
      photoUrl={sampleFace('Sara')}
      city="Málaga"
      pets={[]}
      sitter={{ user_id: 'me', ...sampleSitter }}
      onSitter={() => {}}
      onBack={() => {}}
      recommendations={{ list: [], newSince: '', link: 'https://homami-sepia.vercel.app/?sitter=3f9a2c7b1e', shareText: sitterShareText('Sara') }}
    />
  ),
}

/** Your profile as a sitter, with a new recommendation since you last looked. */
export const ProfileAsSitterRecs: StoryObj = {
  name: '3. Your profile as a sitter, with recommendations',
  render: () => (
    <MyProfile
      name="Sara"
      photoUrl={sampleFace('Sara')}
      city="Málaga"
      pets={[]}
      sitter={{ user_id: 'me', ...sampleSitter }}
      onSitter={() => {}}
      onBack={() => {}}
      recommendations={{
        list: sampleRecommendations,
        newSince: sampleRecommendations[1].created_at,
        link: 'https://homami-sepia.vercel.app/?sitter=3f9a2c7b1e',
        shareText: sitterShareText('Sara'),
      }}
      onInviteSitter={() => {}}
    />
  ),
}
