import type { Meta, StoryObj } from '@storybook/react-vite'
import { userEvent, within } from 'storybook/test'
import { SetUpProfile } from './SetUpProfile'
import { sampleFace } from '../stories-support/sampleFaces'

const meta: Meta<typeof SetUpProfile> = {
  title: 'Screens/Set up your profile',
  component: SetUpProfile,
  parameters: {
    layout: 'centered',
    options: { showPanel: false },
    design: { type: 'figma', url: 'https://www.figma.com/design/SyIrJ3CngOXOHcBvhMSi8Q/Homami-app-v0?node-id=85-10570' },
  },
  decorators: [
    (Story) => (
      <div className="h-[852px] w-[393px] overflow-y-auto rounded-[20px] border border-soft-grey bg-surface [&>main]:min-h-full">
        <Story />
      </div>
    ),
  ],
  args: { onSubmit: () => new Promise((resolve) => setTimeout(resolve, 1200)) },
}
export default meta
type Story = StoryObj<typeof SetUpProfile>

/** Right after joining. Tap the circle to choose a photo from your computer or phone. */
export const Default: Story = {}

/** Coming back to edit: what was saved is filled in. */
export const Filled: Story = {
  args: { initial: { firstName: 'Sara', city: 'Málaga', avatarUrl: sampleFace('Sara') } },
}

/** Tapping Next without a first name. */
export const NeedsName: Story = {
  name: 'Needs a name',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }))
  },
}
