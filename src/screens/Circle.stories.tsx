import type { Meta, StoryObj } from '@storybook/react-vite'
import { AppLayout } from './AppLayout'
import { CircleContent, CirclePage, ExtendedCircleContent, HomeContent, InviteFriends, JoinCircle, PersonPage } from './CircleScreens'
import { NewPost } from './NewPost'
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
      <CirclePage view="circle" onView={() => {}} showInvite onInvite={() => {}}>
        <CircleContent members={people} onInvite={() => {}} onOpenPerson={() => {}} />
      </CirclePage>
    </AppLayout>
  ),
}

/** Before anyone has joined. */
export const EmptyCircle: StoryObj = {
  name: 'Your circle: empty',
  render: () => (
    <AppLayout me={me} tab="circle" onTab={() => {}} onOpenProfile={() => {}}>
      <CirclePage view="circle" onView={() => {}} showInvite={false} onInvite={() => {}}>
        <CircleContent members={[]} onInvite={() => {}} onOpenPerson={() => {}} />
      </CirclePage>
    </AppLayout>
  ),
}

/** Figma 134:18457 "Extended Circle" tab: friends of the people in your circle. */
export const ExtendedCircle: StoryObj = {
  name: 'Extended circle',
  render: () => (
    <AppLayout me={me} tab="circle" onTab={() => {}} onOpenProfile={() => {}}>
      <CirclePage view="extended" onView={() => {}} showInvite onInvite={() => {}}>
        <ExtendedCircleContent
          hasCircle
          onOpenPerson={() => {}}
          people={[
            { id: '4', name: 'Noah Kim', city: 'Málaga', photoUrl: sampleFace('Noah Kim'), sharedCount: 2 },
            { id: '5', name: 'Sofia Ramirez', city: 'Benalmádena', photoUrl: sampleFace('Sofia Ramirez'), sharedCount: 1 },
          ]}
        />
      </CirclePage>
    </AppLayout>
  ),
}

/** Home: the wall. Your own posts have a Delete button. */
export const Home: StoryObj = {
  render: () => (
    <AppLayout me={me} tab="home" onTab={() => {}} onOpenProfile={() => {}}>
      <HomeContent
        me={me}
        hasCircle
        onNewPost={() => {}}
        onInvite={() => {}}
        posts={[
          { id: 'a', authorName: 'Lena', authorPhotoUrl: sampleFace('Lena Morales'), petName: 'Rayo', body: 'Rayo discovered the beach today and refused to leave until sunset.', when: '2h ago', city: 'Málaga' },
          { id: 'b', authorName: 'Sara', authorPhotoUrl: sampleFace('Sara'), petName: 'Buddy', body: 'Buddy found the sunniest spot on the terrace.', when: 'Yesterday', city: 'Málaga', onDelete: () => {} },
        ]}
      />
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

/** Home before anyone has posted, with no circle yet. */
export const HomeEmpty: StoryObj = {
  name: 'Home: empty',
  render: () => (
    <AppLayout me={me} tab="home" onTab={() => {}} onOpenProfile={() => {}}>
      <HomeContent me={me} hasCircle={false} posts={[]} onNewPost={() => {}} onInvite={() => {}} />
    </AppLayout>
  ),
}

/** Writing a post: which pet, a photo, a few words. Not in Figma yet. */
export const WritePost: StoryObj = {
  name: 'New post',
  render: () => (
    <NewPost
      onBack={() => {}}
      onSubmit={() => new Promise((r) => setTimeout(r, 1000))}
      pets={[
        { id: '1', name: 'Buddy', photoUrl: sampleFace('Buddy', 3) },
        { id: '2', name: 'Mushroom' },
      ]}
    />
  ),
}
