import type { Meta, StoryObj } from '@storybook/react-vite'
import { userEvent, within } from 'storybook/test'
import { PetType } from './PetType'
import { AddPet } from './AddPet'

const phone = (Story: React.ComponentType) => (
  <div className="h-[852px] w-[393px] overflow-y-auto rounded-[20px] border border-soft-grey bg-surface [&>main]:min-h-full">
    <Story />
  </div>
)

const meta: Meta = {
  title: 'Screens/Add your pet',
  parameters: { layout: 'centered', options: { showPanel: false } },
  decorators: [phone],
}
export default meta

/** Figma 85:10601. Tap Dog or Cat: the card lights up, then the form opens (in the app). */
export const ChooseDogOrCat: StoryObj<typeof PetType> = {
  name: 'Tell us about your pet',
  render: () => <PetType onChoose={() => {}} onSkip={() => {}} />,
  parameters: { design: { type: 'figma', url: 'https://www.figma.com/design/SyIrJ3CngOXOHcBvhMSi8Q/Homami-app-v0?node-id=85-10601' } },
}

/** Figma 90:6293. Only the name is needed. */
export const PetForm: StoryObj<typeof AddPet> = {
  name: 'Pet form',
  render: () => <AddPet kind="dog" onBack={() => {}} onSubmit={() => new Promise((r) => setTimeout(r, 1200))} />,
  parameters: { design: { type: 'figma', url: 'https://www.figma.com/design/SyIrJ3CngOXOHcBvhMSi8Q/Homami-app-v0?node-id=90-6293' } },
}

/** Tapping Save pet without a name. */
export const PetFormNeedsName: StoryObj<typeof AddPet> = {
  name: 'Pet form: needs a name',
  render: () => <AddPet kind="cat" onBack={() => {}} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Save pet' }))
  },
}

/** Not in Figma: tap a pet on Your profile. Same form, filled in, with Save and Remove pet. */
export const EditPet: StoryObj<typeof AddPet> = {
  name: 'Edit pet',
  render: () => (
    <AddPet
      title="Edit pet"
      kind="dog"
      initial={{ name: 'Buddy', age: '9', description: 'Loves long walks and belly rubs. Needs his pills with breakfast.' }}
      onBack={() => {}}
      onSubmit={() => new Promise((r) => setTimeout(r, 1200))}
      onRemove={() => new Promise((r) => setTimeout(r, 1200))}
    />
  ),
}

/** Tapping Remove pet: it asks once before removing. */
export const EditPetRemove: StoryObj<typeof AddPet> = {
  name: 'Edit pet: remove',
  render: () => (
    <AddPet title="Edit pet" kind="cat" initial={{ name: 'Mia', age: '4 months' }} onBack={() => {}} onRemove={() => new Promise((r) => setTimeout(r, 1200))} />
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Remove pet' }))
  },
}
