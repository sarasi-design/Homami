import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { SignUp } from './SignUp'

const meta: Meta<typeof SignUp> = {
  title: 'Screens/Sign up',
  component: SignUp,
  parameters: {
    layout: 'centered',
    options: { showPanel: false },
    design: { type: 'figma', url: 'https://www.figma.com/design/SyIrJ3CngOXOHcBvhMSi8Q/Homami-app-v0?node-id=85-10546' },
  },
  // Shown inside an iPhone 16 sized frame (393 × 852)
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
type Story = StoryObj<typeof SignUp>

/** As people first see it. Try tapping Create profile with empty fields, or the eye in the password. */
export const Default: Story = {}

/** Someone who opened an invite link: the code is already filled in. */
export const FromInviteLink: Story = {
  name: 'From an invite link',
  args: { initialInviteCode: 'LUNA42' },
}

/** What happens when Create profile is tapped with a typo in the email, a short password and no invitation code. */
export const NeedsFixing: Story = {
  name: 'Needs fixing',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByPlaceholderText('Email'), 'sara@gmail')
    await userEvent.type(canvas.getByPlaceholderText('Password'), 'pawsy')
    await userEvent.click(canvas.getByRole('button', { name: 'Create profile' }))
    await expect(canvas.getByText(/doesn’t look right/)).toBeVisible()
    await expect(canvas.getByText(/need an invitation code/)).toBeVisible()
  },
}

/** When the account can't be created, e.g. the email is already used. The message comes from the server later on. */
export const AlreadyRegistered: Story = {
  name: 'Email already used',
  args: {
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 600))
      throw new Error('There’s already a profile with this email. Try logging in instead.')
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByPlaceholderText('Email'), 'sara@example.com')
    await userEvent.type(canvas.getByPlaceholderText('Password'), 'walkies-at-noon')
    await userEvent.type(canvas.getByPlaceholderText('Invitation Code'), 'LUNA42')
    await userEvent.click(canvas.getByRole('button', { name: 'Create profile' }))
  },
}
