import type { Meta, StoryObj } from '@storybook/react-vite'
import { AppLayout } from './AppLayout'
import { CircleContent, HomeContent, InviteFriends, JoinCircle, PersonPage } from './CircleScreens'
import { sampleFace } from '../stories-support/sampleFaces'

const meta: Meta = {
  title: 'Screens/Circle',
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

const me = { name: 'Sara', photoUrl: sampleFace('Sara') }
const people = [
  { id: '1', name: 'Lena Morales', city: 'Málaga', photoUrl: sampleFace('Lena Morales'), sharedCount: 3 },
  { id: '2', name: 'Ethan Brooks', city: 'Torremolinos', photoUrl: sampleFace('Ethan Brooks'), sharedCount: 1 },
  { id: '3', name: 'Maya Patel', city: null, photoUrl: sampleFace('Maya Patel'), sharedCount: 0 },
]

/** Figma 134:18457, v1. Tap a person to open their profile. */
export const YourCircle: StoryObj = {
  name: 'Your circle',
  render: () => (
    <AppLayout me={me} tab="circle" onTab={() => {}} onOpenProfile={() => {}}>
      <CircleContent members={people} onInvite={() => {}} onOpenPerson={() => {}} />
    </AppLayout>
  ),
}

/** Before anyone has joined. */
export const EmptyCircle: StoryObj = {
  name: 'Your circle: empty',
  render: () => (
    <AppLayout me={me} tab="circle" onTab={() => {}} onOpenProfile={() => {}}>
      <CircleContent members={[]} onInvite={() => {}} onOpenPerson={() => {}} />
    </AppLayout>
  ),
}

/** Home, until the wall is built. */
export const Home: StoryObj = {
  render: () => (
    <AppLayout me={me} tab="home" onTab={() => {}} onOpenProfile={() => {}}>
      <HomeContent onInvite={() => {}} />
    </AppLayout>
  ),
}

/** Figma 250:128185. */
export const Invite: StoryObj = {
  name: 'Invite friends',
  render: () => <InviteFriends link="homami-sepia.vercel.app/?invite=VWR7FKHW" onBack={() => {}} />,
}

/** Someone in your circle: their profile and pets, read-only. */
export const FriendProfile: StoryObj = {
  name: 'Friend’s profile',
  render: () => (
    <PersonPage
      onBack={() => {}}
      person={{ name: 'Lena Morales', photoUrl: sampleFace('Lena Morales'), city: 'Málaga', bio: 'Two rescue greyhounds and a very bossy cat.' }}
      pets={[
        { id: 'a', name: 'Rayo', kindLabel: 'Dog', ageLabel: '6 years old' },
        { id: 'b', name: 'Luna', kindLabel: 'Dog', ageLabel: '4 years old' },
        { id: 'c', name: 'Mishi', kindLabel: 'Cat', ageLabel: '2 years old' },
      ]}
    />
  ),
}

/** Opening a friend's invite link when you already have an account. */
export const JoinPrompt: StoryObj = {
  name: 'Add to your circle?',
  render: () => <JoinCircle inviter={{ name: 'Lena', photoUrl: sampleFace('Lena Morales') }} onAccept={() => {}} onDecline={() => {}} />,
}
