import type { Meta, StoryObj } from '@storybook/react-vite'
import { AppLayout } from './AppLayout'
import { CircleTabs, PersonPage, SittersContent } from './CircleScreens'
import { HowWillYouUse } from './HowWillYouUse'
import { SitterSetup } from './SitterSetup'
import { MyProfile } from './MyProfile'
import { sampleFace } from '../stories-support/sampleFaces'
import { sampleSitter } from '../stories-support/sampleSitter'

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

const me = { name: 'Sara', photoUrl: sampleFace('Sara') }
const wait = () => new Promise<void>((r) => setTimeout(r, 1200))

/** Figma 85:10906. Right after "Let's set up your profile". */
export const HowWillYou: StoryObj = {
  name: '1. How will you use Homami?',
  render: () => <HowWillYouUse onSubmit={wait} />,
  parameters: { design: { type: 'figma', url: 'https://www.figma.com/design/SyIrJ3CngOXOHcBvhMSi8Q/Homami-app-v0?node-id=85-10906' } },
}

/** Figma "USER OFFERS PET SITTING" (85:10659 → 91:10326), on one page. Only "What you offer" is needed. */
export const Setup: StoryObj = {
  name: '2. Set up pet sitter profile',
  render: () => <SitterSetup onSubmit={wait} onSkip={() => {}} />,
  parameters: { design: { type: 'figma', url: 'https://www.figma.com/design/SyIrJ3CngOXOHcBvhMSi8Q/Homami-app-v0?node-id=91-10326' } },
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

/** Circle › Pet sitters: everyone offering pet sitting, your circle first, then your city. */
export const SittersList: StoryObj = {
  name: '4. Pet sitters list',
  render: () => (
    <AppLayout me={me} tab="circle" onTab={() => {}} onOpenProfile={() => {}}>
      <CircleTabs view="sitters" onView={() => {}}>
        <SittersContent
          iAmSitter={false}
          onOpenSitter={() => {}}
          onBecomeSitter={() => {}}
          sitters={[
            { id: '1', name: 'Lena Morales', photoUrl: sampleFace('Lena Morales'), city: 'Málaga', availability: 'Available now', inCircle: true, offers: ['dog_walking', 'boarding'], price: 'From 9 €' },
            { id: '2', name: 'Daniel Medina', photoUrl: sampleFace('Daniel Medina'), city: 'Málaga', availability: 'Available from 3 Nov', offers: ['live_in', 'dog_walking'], price: 'From 12 €' },
            { id: '3', name: 'Vera Rodrigues', photoUrl: sampleFace('Vera Rodrigues'), city: 'Torremolinos', availability: 'Available now', offers: ['accommodation_exchange'], price: 'Exchange, no fees' },
          ]}
        />
      </CircleTabs>
    </AppLayout>
  ),
}

/** A sitter you don't know yet: their profile and offers, but not their pets. */
export const SitterPage: StoryObj = {
  name: '5. A pet sitter’s profile',
  render: () => (
    <PersonPage
      person={{ name: 'Daniel Medina', photoUrl: sampleFace('Daniel Medina'), city: 'Málaga', bio: 'I’m a dedicated pet sitter and animal lover who works from home.' }}
      pets={null}
      sitter={{ user_id: 'd', ...sampleSitter }}
      onBack={() => {}}
    />
  ),
}
