import type { Meta, StoryObj } from '@storybook/react-vite'
import { MessageCircle } from 'lucide-react'
import { CountBadge } from './CountBadge'
import { Icon } from './Icon'
import { Avatar } from './Avatar'

const meta: Meta<typeof CountBadge> = {
  title: 'Basics/Count badge',
  component: CountBadge,
  args: { count: 2, floating: false },
  parameters: {
    options: { showPanel: true },
    // Same as the unread badge on Chats in the Figma bottom nav (129:8747)
    design: { type: 'figma', url: 'https://www.figma.com/design/SyIrJ3CngOXOHcBvhMSi8Q/Homami-app-v0?node-id=129-8747' },
  },
}
export default meta
type Story = StoryObj<typeof CountBadge>

export const Playground: Story = {}

/** On an icon (Chats), on your photo (bookings waiting), and on its own in a row. Nothing shows at 0; above 9 it says 9+. */
export const Uses: Story = {
  render: () => (
    <div className="flex items-center gap-xl p-l">
      <span className="relative">
        <Icon icon={MessageCircle} size="large" />
        <CountBadge count={2} floating />
      </span>
      <span className="relative">
        <Avatar size="medium" name="Sara" />
        <CountBadge count={1} floating className="-right-[4px]" />
      </span>
      <span className="flex items-center gap-s text-label">
        <strong>Your bookings</strong> <CountBadge count={12} />
      </span>
      <CountBadge count={0} />
    </div>
  ),
}
