import type { Meta, StoryObj } from '@storybook/react-vite'
import { MapPin } from 'lucide-react'
import { TextArea, TextInput } from './TextInput'

const meta: Meta<typeof TextInput> = {
  title: 'Basics/Text input',
  component: TextInput,
  args: { label: 'First name', placeholder: 'Add your first name' },
  parameters: {
    options: { showPanel: true },
    design: { type: 'figma', url: 'https://www.figma.com/design/SyIrJ3CngOXOHcBvhMSi8Q/Homami-app-v0?node-id=72-7839' },
  },
  decorators: [(Story) => <div className="w-[361px]"><Story /></div>],
}
export default meta
type Story = StoryObj<typeof TextInput>

/** Click into it to see the focus state. */
export const Playground: Story = {}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-xl">
      <TextInput label="Rest" placeholder="Add your first name" />
      <TextInput label="Filled" defaultValue="Eva" />
      <TextInput label="Focused" placeholder="Click into a field to see this state" autoFocus />
      <TextInput label="Error" defaultValue="eva@" error="Enter an email like name@example.com" />
      <TextInput label="Disabled" defaultValue="Malaga, Spain" disabled />
    </div>
  ),
}

/** Helper text, a character count and an icon inside the field. */
export const Options: Story = {
  render: () => (
    <div className="flex flex-col gap-xl">
      <TextInput label="Your city" placeholder="Add your city" icon={MapPin} />
      <TextInput label="Pet's name" placeholder="e.g. Luna" helper="This is how your circle will see them" />
      <TextInput label="Nickname" placeholder="Optional" maxLength={30} showCount defaultValue="Lulu" />
    </div>
  ),
}

/** For longer text like a bio or a pet's description. */
export const MultiLine: Story = {
  name: 'Multi-line',
  render: () => (
    <TextArea
      label="About your pet"
      placeholder="Add a short description of your pet's personality and if they need any type of special care"
      maxLength={300}
      showCount
    />
  ),
}

/** Matching the Figma profile setup, where fields show the placeholder only. The label is still there for screen readers. */
export const ProfileSetup: Story = {
  name: 'In context: profile setup',
  render: () => (
    <div className="flex flex-col gap-xl">
      <h2 className="text-title text-dark-sage">Let's set up your profile</h2>
      <TextInput label="First name" hideLabel placeholder="Add your first name" />
      <TextInput label="City" hideLabel placeholder="Add your city" icon={MapPin} />
    </div>
  ),
}
