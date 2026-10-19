import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { AppLayout } from './AppLayout'
import { CircleContent, CirclePage, ExtendedCircleContent, HomeContent, InviteFriends, JoinCircle, PersonPage } from './CircleScreens'
import type { WallFilter, WallItem } from './CircleScreens'
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

/** Home: the wall. Your circle's posts, with pet sitters in between (sage-bordered cards). Filters on top. */
function HomeDemo({ withCircle }: { withCircle: boolean }) {
  const [filter, setFilter] = useState<WallFilter>('all')
  const sitterCards: WallItem[] = [
    { kind: 'sitter', id: 's1', name: 'Lena', photoUrl: sampleFace('Lena Morales'), relation: 'In your circle', availability: 'Available now', offers: ['dog_walking', 'boarding'], price: 'From 9 €' },
    { kind: 'sitter', id: 's2', name: 'Noah', photoUrl: sampleFace('Noah Kim'), relation: 'In your extended circle', availability: 'Available from 3 Nov', offers: ['live_in'], price: 'From 25 €' },
    { kind: 'sitter', id: 's3', name: 'Daniel', photoUrl: sampleFace('Daniel Medina'), relation: 'Near you · Málaga', availability: 'Available now', offers: ['accommodation_exchange', 'dog_walking'], price: 'Exchange, no fees' },
  ]
  const posts: WallItem[] = [
    { kind: 'post', id: 'a', authorName: 'Lena', authorPhotoUrl: sampleFace('Lena Morales'), petName: 'Rayo', body: 'Rayo discovered the beach today and refused to leave until sunset.', when: '2h ago', city: 'Málaga' },
    { kind: 'post', id: 'b', authorName: 'Sara', authorPhotoUrl: sampleFace('Sara'), petName: 'Buddy', body: 'Buddy found the sunniest spot on the terrace.', when: 'Yesterday', city: 'Málaga', onDelete: () => {} },
    { kind: 'post', id: 'c', authorName: 'Ethan', authorPhotoUrl: sampleFace('Ethan Brooks'), petName: 'Milo', body: 'Milo met his first hedgehog. Both very confused.', when: '2 days ago', city: 'Torremolinos' },
  ]
  const items: WallItem[] = !withCircle
    ? sitterCards.slice(2)
    : filter === 'sitters'
      ? sitterCards
      : filter === 'extended'
        ? [sitterCards[1]]
        : filter === 'circle'
          ? [...posts, sitterCards[0]]
          : [...posts, ...sitterCards]
  return (
    <AppLayout me={me} tab="home" header={false} onTab={() => {}} onOpenProfile={() => {}}>
      <HomeContent
        me={me}
        hasCircle={withCircle}
        items={items}
        filter={filter}
        onFilter={setFilter}
        iAmSitter={false}
        onNewPost={() => {}}
        onOpenProfile={() => {}}
        onInvite={() => {}}
        onOpenSitter={() => {}}
        onBecomeSitter={() => {}}
      />
    </AppLayout>
  )
}

export const Home: StoryObj = { render: () => <HomeDemo withCircle /> }

/** No circle yet: the wall shows pet sitters near you, and the invite banner. */
export const HomeNoCircle: StoryObj = { name: 'Home: no circle yet', render: () => <HomeDemo withCircle={false} /> }

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

/** Home with nothing to show yet. */
export const HomeEmpty: StoryObj = {
  name: 'Home: empty',
  render: () => (
    <AppLayout me={me} tab="home" header={false} onTab={() => {}} onOpenProfile={() => {}}>
      <HomeContent
        me={me}
        hasCircle={false}
        items={[]}
        filter="all"
        onFilter={() => {}}
        iAmSitter
        onNewPost={() => {}}
        onOpenProfile={() => {}}
        onInvite={() => {}}
        onOpenSitter={() => {}}
        onBecomeSitter={() => {}}
      />
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
