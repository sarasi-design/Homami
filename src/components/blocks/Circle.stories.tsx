import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { House, MessageCircle, Users } from 'lucide-react'
import { BottomNav } from './BottomNav'
import { Header } from './Header'
import { PersonCard } from './PersonCard'
import { Banner } from './Banner'
import { Steps } from './Steps'
import { InviteLinkCard } from './InviteLinkCard'
import { InviteCodes } from './InviteCodes'
import type { InviteCodeItem } from './InviteCodes'
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
  { id: 'chats', label: 'Chats', icon: MessageCircle, badge: 2 },
]

function NavDemo() {
  const [current, setCurrent] = useState('circle')
  return (
    <div className="relative h-[160px] overflow-hidden [&_nav]:absolute">
      <BottomNav items={tabs} current={current} onChange={setCurrent} />
    </div>
  )
}

/** Figma "Bottom nav" (2:1012): Home, Circle and Chats (Plans later). The current tab is Dark sage; the badge counts chats with unread messages. */
export const BottomNavigation: StoryObj = { name: 'Bottom nav', render: () => <NavDemo /> }

/** Main pages: your photo on the left opens your profile. */
export const MainHeader: StoryObj = {
  name: 'Header with your photo',
  render: () => <Header me={{ name: 'Sara', photoUrl: sampleFace('Sara'), onOpen: () => {} }} />,
}

/** A booking waits for your answer: a badge on your photo, which opens Your profile (Sara, Nov 11). */
export const MainHeaderBadge: StoryObj = {
  name: 'Header with your photo · booking waiting',
  render: () => (
    <Header me={{ name: 'Sara', photoUrl: sampleFace('Sara'), onOpen: () => {}, badge: 1, badgeLabel: '1 booking waiting for your answer' }} />
  ),
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

/** With the code (Sara, Nov 11): the code comes first with "Copy code"; the full link sits below with "Copy link". */
export const InviteCodeCard: StoryObj = {
  name: 'Invite link card · with code',
  parameters: { design: { type: 'figma', url: 'https://www.figma.com/design/SyIrJ3CngOXOHcBvhMSi8Q/Homami-app-v0?node-id=250-128185' } },
  render: () => (
    <div className="p-l">
      <InviteLinkCard link="https://homami-sepia.vercel.app/?invite=VWR7FKHW" code="VWR7FKHW" />
    </div>
  ),
}

const storyNow = new Date('2026-11-11T10:00:00Z')
const sampleCodes: InviteCodeItem[] = [
  { code: 'K7MPQ2XA', uses: 0, expires_at: '2026-12-11T10:00:00Z' },
  { code: 'R4TWZ9HN', uses: 1, expires_at: '2026-12-01T10:00:00Z' },
  { code: 'B8CDE3FJ', uses: 0, expires_at: '2026-11-02T10:00:00Z' },
]

function InviteCodesDemo({ start, error }: { start: InviteCodeItem[]; error?: string }) {
  const [codes, setCodes] = useState(start)
  return (
    <div className="p-l">
      <InviteCodes
        codes={codes}
        now={storyNow}
        error={error}
        linkFor={(code) => `https://homami-sepia.vercel.app/?invite=${code}`}
        onCreate={() => setCodes((list) => [{ code: `NEW${list.length}CODE`.slice(0, 8), uses: 0, expires_at: '2026-12-11T10:00:00Z' }, ...list])}
        onRemove={(code) => setCodes((list) => list.filter((c) => c.code !== code))}
      />
    </div>
  )
}

/** Invite friends on Your profile (not in Figma yet): a code for one person, 30 days. Unused, used and expired codes. */
export const InviteCodeList: StoryObj = {
  name: 'Invite codes',
  parameters: { design: { type: 'figma', url: 'https://www.figma.com/design/SyIrJ3CngOXOHcBvhMSi8Q/Homami-app-v0?node-id=85-10926' } },
  render: () => <InviteCodesDemo start={sampleCodes} />,
}

export const InviteCodesEmpty: StoryObj = {
  name: 'Invite codes · none yet',
  render: () => <InviteCodesDemo start={[]} />,
}

export const InviteCodesNotSetUp: StoryObj = {
  name: 'Invite codes · database not updated',
  render: () => <InviteCodesDemo start={[]} error="Homami’s database needs an update for invite codes (setup script 12). Please try again later." />,
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
