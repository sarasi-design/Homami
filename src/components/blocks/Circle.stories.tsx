import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { House, Users } from 'lucide-react'
import { BottomNav } from './BottomNav'
import { Header } from './Header'
import { PersonCard } from './PersonCard'
import { Banner } from './Banner'
import { Steps } from './Steps'
import { InviteLinkCard } from './InviteLinkCard'
import { sampleFace } from '../../stories-support/sampleFaces'
import welcomeCatDog from '../../assets/welcome-cat-dog.webp'

const meta: Meta = {
  title: 'Blocks/Circle',
  parameters: { options: { showPanel: false } },
  decorators: [(Story) => <div className="w-[393px] bg-surface"><Story /></div>],
}
export default meta

const tabs = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'circle', label: 'Circle', icon: Users },
]

function NavDemo() {
  const [current, setCurrent] = useState('circle')
  return (
    <div className="relative h-[160px] overflow-hidden [&_nav]:absolute">
      <BottomNav items={tabs} current={current} onChange={setCurrent} />
    </div>
  )
}

/** Figma "Bottom nav" (2:1012). v1 has Home and Circle; the current tab is Dark sage. */
export const BottomNavigation: StoryObj = { name: 'Bottom nav', render: () => <NavDemo /> }

/** Main pages: your photo on the left opens your profile. */
export const MainHeader: StoryObj = {
  name: 'Header with your photo',
  render: () => <Header me={{ name: 'Sara', photoUrl: sampleFace('Sara'), onOpen: () => {} }} />,
}

/** Figma "User-Card-Circle", v1. The whole card opens their profile. */
export const PersonCards: StoryObj = {
  name: 'Person card',
  render: () => (
    <div className="flex flex-col gap-l p-l">
      <PersonCard name="Lena Morales" city="Málaga" sharedCount={8} photoUrl={sampleFace('Lena Morales')} onOpen={() => {}} />
      <PersonCard name="Ethan Brooks" sharedCount={0} onOpen={() => {}} />
    </div>
  ),
}

/** The peach box with the cat and dog. */
export const Banners: StoryObj = {
  name: 'Banner',
  render: () => (
    <div className="p-l">
      <Banner title={<>Share Homami<br />with people you trust</>} image={welcomeCatDog} />
    </div>
  ),
}

/** Copy puts the link on the clipboard; Share opens the phone's share sheet. */
export const InviteLink: StoryObj = {
  name: 'Invite link card',
  render: () => (
    <div className="p-l">
      <InviteLinkCard link="homami-sepia.vercel.app/?invite=VWR7FKHW" />
    </div>
  ),
}

/** "How it works" with numbered steps. */
export const HowItWorks: StoryObj = {
  name: 'Steps',
  render: () => (
    <div className="p-l">
      <Steps
        title="How it works"
        steps={[
          'Your friend receives your personal invite link and signs up to Homami',
          'They are automatically added to your circle when they join',
          'You can start exchanging pet care and recommendations and building trust together',
        ]}
      />
    </div>
  ),
}
