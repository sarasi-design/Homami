import type { Meta, StoryObj } from '@storybook/react-vite'
import { RecommendSitter } from './RecommendSitter'
import { SitterPublicPage } from './SitterPublicPage'
import { FirstRecommendations } from './FirstRecommendations'
import { HomeContent } from './CircleScreens'
import { sampleFace } from '../stories-support/sampleFaces'
import { samplePublicPage } from '../stories-support/sampleRecommendations'

const meta: Meta = {
  title: 'Screens/Recommendations',
  // Figma Chat+book (140:6880) has the Endorse and Share steps, without screens yet (Sara, Nov 15, 2026)
  parameters: { layout: 'fullscreen', design: { type: 'figma', url: 'https://www.figma.com/design/SyIrJ3CngOXOHcBvhMSi8Q/Homami-app-v0?node-id=140-6880' } },
}
export default meta

const pets = [
  { id: 'luna', name: 'Luna', photoUrl: sampleFace('Luna dog', 5) },
  { id: 'milo', name: 'Milo', photoUrl: sampleFace('Milo cat', 6) },
]
const noop = async () => {}

export const Recommend: StoryObj = {
  name: 'Recommend a sitter',
  render: () => <RecommendSitter sitterName="Daniel" sitterPhotoUrl={sampleFace('Daniel', 4)} pets={pets} onSubmit={noop} onBack={() => {}} />,
}

export const EditRecommendation: StoryObj = {
  name: 'Recommend a sitter, editing',
  render: () => (
    <RecommendSitter
      sitterName="Daniel"
      sitterPhotoUrl={sampleFace('Daniel', 4)}
      pets={pets}
      initial={{ pet_ids: ['luna'], note: 'Looked after Luna for 3 weeks in August' }}
      onSubmit={noop}
      onRemove={noop}
      onBack={() => {}}
    />
  ),
}

/** What anyone with Daniel's link sees, even without an account: no pets, no posts. */
export const PublicPage: StoryObj = {
  name: 'Sitter’s public page',
  render: () => <SitterPublicPage page={samplePublicPage} onContact={() => {}} onRecommend={() => {}} onLogIn={() => {}} />,
}

export const PublicPageNew: StoryObj = {
  name: 'Sitter’s public page, no recommendations yet',
  render: () => <SitterPublicPage page={{ ...samplePublicPage, recommendations: [], recommend_count: 0 }} onContact={() => {}} onRecommend={() => {}} onLogIn={() => {}} />,
}

export const BrokenLink: StoryObj = {
  name: 'Sitter’s link that doesn’t work',
  render: () => <SitterPublicPage page={null} onContact={() => {}} onRecommend={() => {}} onLogIn={() => {}} />,
}

export const First: StoryObj = {
  name: 'Get your first recommendations',
  render: () => <FirstRecommendations name="Daniel" link="https://homami-sepia.vercel.app/?sitter=3f9a2c7b1e" onDone={() => {}} />,
}

/** On Home: "Daniel is on Homami now. Would you recommend them?" with Recommend and Not now (Nov 15, 2026) */
export const HomeAskToRecommend: StoryObj = {
  name: 'Home: recommend the sitter you invited',
  render: () => (
    <div className="mx-auto flex max-w-[480px] flex-col gap-l p-l">
      <HomeContent
        items={[]}
        filter="all"
        onFilter={() => {}}
        hasCircle
        iAmSitter={false}
        onInvite={() => {}}
        onOpenSitter={() => {}}
        onOpenRequest={() => {}}
        onBecomeSitter={() => {}}
        toRecommend={[{ id: 'daniel', name: 'Daniel' }]}
        onRecommend={() => {}}
        onSkipRecommend={() => {}}
      />
    </div>
  ),
}
