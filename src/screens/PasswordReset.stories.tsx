import type { Meta, StoryObj } from '@storybook/react-vite'
import { userEvent, within } from 'storybook/test'
import { ForgotPassword, NewPassword, ResetLinkSent } from './PasswordReset'

const meta: Meta = {
  title: 'Screens/Forgot password',
  parameters: { layout: 'centered', options: { showPanel: false } },
  decorators: [
    (Story) => (
      <div className="h-[852px] w-[393px] overflow-y-auto rounded-[20px] border border-soft-grey bg-surface [&>main]:min-h-full">
        <Story />
      </div>
    ),
  ],
}
export default meta

const wait = () => new Promise<void>((r) => setTimeout(r, 1200))

/** From "Forgot your password?" on Log in. Not in Figma yet: built from the Log in parts. */
export const Forgot: StoryObj = {
  name: '1. Forgot your password',
  render: () => <ForgotPassword initialEmail="sara@example.com" onSubmit={wait} onBack={() => {}} />,
}

/** After Send link. It never says whether the email has a profile, so nobody can check who's on Homami. */
export const Sent: StoryObj = {
  name: '2. Check your inbox',
  render: () => <ResetLinkSent email="sara@example.com" onBack={() => {}} />,
}

/** The link in the email opens this. Saving logs you straight in. */
export const ChooseNew: StoryObj = {
  name: '3. Choose a new password',
  render: () => <NewPassword onSubmit={wait} />,
}

/** Too short. */
export const ChooseNewTooShort: StoryObj = {
  name: '3. Choose a new password: too short',
  render: () => <NewPassword onSubmit={wait} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByPlaceholderText('New password'), 'woof')
    await userEvent.click(canvas.getByRole('button', { name: 'Save password' }))
  },
}
