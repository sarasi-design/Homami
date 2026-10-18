import type { Meta, StoryObj } from '@storybook/react-vite'
import { userEvent, within } from 'storybook/test'
import { LogIn } from './LogIn'

const meta: Meta<typeof LogIn> = {
  title: 'Screens/Log in',
  component: LogIn,
  parameters: { layout: 'centered', options: { showPanel: false } },
  // Shown inside an iPhone 16 sized frame (393 × 852)
  decorators: [
    (Story) => (
      <div className="h-[852px] w-[393px] overflow-y-auto rounded-[20px] border border-soft-grey bg-surface [&>main]:min-h-full">
        <Story />
      </div>
    ),
  ],
  args: { onSubmit: () => new Promise((resolve) => setTimeout(resolve, 1200)), onForgotPassword: () => {} },
}
export default meta
type Story = StoryObj<typeof LogIn>

/** Not designed in Figma yet: made from the Sign up screen's parts. */
export const Default: Story = {}

/** When the email and password don't match an account. The message will come from the server. */
export const WrongPassword: Story = {
  name: 'Wrong password',
  args: {
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 600))
      throw new Error('That email and password don’t match. Check them and try again.')
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByPlaceholderText('Email'), 'sara@example.com')
    await userEvent.type(canvas.getByPlaceholderText('Password'), 'walkies-at-midnight')
    await userEvent.click(canvas.getByRole('button', { name: 'Log in' }))
  },
}
