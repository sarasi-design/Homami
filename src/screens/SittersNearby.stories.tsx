import type { Meta, StoryObj } from '@storybook/react-vite'
import { SittersMap } from './SittersMap'
import { HomeContent } from './CircleScreens'
import { sampleMe, sampleNearbySitters } from '../stories-support/sampleNearby'

const meta: Meta = {
  title: 'Screens/Sitters near you',
  // No Figma frame yet: built from the wall's sitter card and the profile's pin (Sara, Nov 15, 2026)
  parameters: { layout: 'fullscreen', design: { type: 'figma', url: 'https://www.figma.com/design/SyIrJ3CngOXOHcBvhMSi8Q/Homami-app-v0?node-id=134-17763' } },
}
export default meta

const noop = async () => {}
const sitters = sampleNearbySitters.map((s) => ({
  ...s,
  card: {
    name: s.name,
    photoUrl: s.photoUrl,
    relation: `${s.km} km away · Málaga`,
    availability: 'Available now',
    offers: ['live_in', 'dog_walking'],
    price: 'From 12 €',
  },
}))

export const MapNearYou: StoryObj = {
  name: 'Map',
  render: () => <SittersMap sitters={sitters} me={sampleMe} onLocate={noop} onOpenSitter={() => {}} onBack={() => {}} />,
}

export const MapWithoutLocation: StoryObj = {
  name: 'Map, before adding your location',
  render: () => <SittersMap sitters={sitters} me={null} onLocate={noop} onOpenSitter={() => {}} onBack={() => {}} />,
}

export const MapBeforeScript: StoryObj = {
  name: 'Map, before database script 21',
  render: () => <SittersMap sitters={null} me={null} onLocate={noop} onOpenSitter={() => {}} onBack={() => {}} />,
}

const home = (label: string | null) => (
  <div className="mx-auto flex max-w-[480px] flex-col gap-l p-l">
    <HomeContent
      items={sitters.map((s) => ({ kind: 'sitter' as const, ...s.card, id: s.id }))}
      filter="sitters"
      onFilter={() => {}}
      hasCircle
      iAmSitter
      onInvite={() => {}}
      onOpenSitter={() => {}}
      onOpenRequest={() => {}}
      onBecomeSitter={() => {}}
      nearby={{ label, onMap: () => {}, onLocate: noop }}
    />
  </div>
)

export const WallNearYou: StoryObj = { name: 'Home › Sitters: near you', render: () => home('3 pet sitters near you') }
export const WallAddLocation: StoryObj = { name: 'Home › Sitters: add your location', render: () => home(null) }
