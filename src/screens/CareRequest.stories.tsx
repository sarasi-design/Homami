import type { Meta, StoryObj } from '@storybook/react-vite'
import { CareRequest } from './CareRequest'
import { MyProfile } from './MyProfile'
import { PersonPage } from './CircleScreens'
import { sampleFace } from '../stories-support/sampleFaces'
import { sampleRequest } from '../stories-support/sampleRequest'

const meta: Meta = {
  title: 'Screens/Pet care requests',
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
const pets = [
  { id: '1', name: 'Buddy', kindLabel: 'Dog', ageLabel: '9 years old', photoUrl: sampleFace('Buddy', 3) },
  { id: '2', name: 'Mushroom', kindLabel: 'Cat', ageLabel: '2 years old' },
]
const request = { id: 'r1', owner_id: 'me', pet_count: 1, ...sampleRequest }

/** Your profile with no requests yet: the "Need help with your pets?" banner (Figma 85:10926). */
export const ProfileNoRequests: StoryObj = {
  name: '1. Your profile, no requests yet',
  render: () => <MyProfile name="Eva" photoUrl={sampleFace('Eva Miller')} city="Málaga" pets={pets} requests={[]} onNewRequest={() => {}} onBack={() => {}} />,
  parameters: { design: { type: 'figma', url: 'https://www.figma.com/design/SyIrJ3CngOXOHcBvhMSi8Q/Homami-app-v0?node-id=85-10926' } },
}

/**
 * Figma "USER NEEDS PET SITTING" (85:10640 → 85:10889), on one page like the pet sitter setup:
 * What you need · When · Where · Who. Press "Preview request" with nothing picked to see the messages.
 */
export const New: StoryObj = {
  name: '2. Create a request',
  render: () => <CareRequest ownerName="Eva" pets={pets} defaultArea="Málaga" onBack={() => {}} onSubmit={wait} />,
  parameters: { design: { type: 'figma', url: 'https://www.figma.com/design/SyIrJ3CngOXOHcBvhMSi8Q/Homami-app-v0?node-id=90-6520' } },
}

/** Editing one of your requests: "Remove request" at the bottom. */
export const Edit: StoryObj = {
  name: '3. Your request (edit)',
  render: () => <CareRequest mode="edit" initial={sampleRequest} ownerName="Eva" pets={pets} onBack={() => {}} onSubmit={wait} onRemove={wait} />,
}

/** Your profile once a request is published, with a pencil to edit it and + for another. */
export const ProfileWithRequest: StoryObj = {
  name: '4. Your profile with a request',
  render: () => (
    <MyProfile name="Eva" photoUrl={sampleFace('Eva Miller')} city="Málaga" pets={pets} requests={[request]} onNewRequest={() => {}} onOpenRequest={() => {}} onBack={() => {}} />
  ),
}

/** What a pet sitter outside Eva's circle sees: her request with "1 pet", and Message. */
export const SomeoneElse: StoryObj = {
  name: '5. Someone’s profile with a request',
  render: () => (
    <PersonPage
      person={{ name: 'Eva', photoUrl: sampleFace('Eva Miller'), city: 'Málaga', bio: 'Two dogs, one very spoiled cat.' }}
      pets={null}
      requests={[request]}
      onBack={() => {}}
      onMessage={() => {}}
    />
  ),
}
