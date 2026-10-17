import type { Meta, StoryObj } from '@storybook/react-vite'
import { Bell, Camera, Menu, PawPrint, Plus, Search, Share2 } from 'lucide-react'
import { Button, IconButton } from './Button'

const meta: Meta<typeof Button> = {
  title: 'Basics/Button',
  component: Button,
  args: { children: 'Chat', variant: 'primary' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'dark', 'neutral', 'outline', 'ghost'] },
    iconLeft: { control: false },
    iconRight: { control: false },
  },
  parameters: {
    options: { showPanel: true },
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/SyIrJ3CngOXOHcBvhMSi8Q/Homami-app-v0?node-id=105-8598',
    },
  },
}
export default meta
type Story = StoryObj<typeof Button>

/** Try every option from the Controls panel below. */
export const Playground: Story = {}

const variants = ['primary', 'dark', 'neutral', 'outline', 'ghost'] as const

/** Same grid as the Figma component: every style, with and without icons. */
export const AllStyles: Story = {
  name: 'All styles',
  render: () => (
    <div className="grid grid-cols-[repeat(5,max-content)] gap-l items-center">
      {variants.map((v) => (
        <Button key={v} variant={v}>Label</Button>
      ))}
      {variants.map((v) => (
        <Button key={v + '-icon'} variant={v} iconLeft={PawPrint}>Label</Button>
      ))}
      {variants.map((v) => (
        <Button key={v + '-disabled'} variant={v} disabled>Label</Button>
      ))}
    </div>
  ),
}

/** How the buttons appear on real screens. */
export const InContext: Story = {
  name: 'In context',
  render: () => (
    <div className="flex flex-col gap-xl w-[361px]">
      <div className="flex gap-m">
        <Button variant="outline" fullWidth>Add to Circle</Button>
        <Button fullWidth>Chat</Button>
      </div>
      <div className="flex gap-m">
        <Button variant="neutral" iconRight={Share2}>Share</Button>
        <Button variant="outline">Not Now</Button>
      </div>
      <Button variant="dark">Create a profile</Button>
    </div>
  ),
}

/** Icon-only buttons: header icons, the photo badge, "add" buttons. */
export const IconOnly: Story = {
  name: 'Icon only',
  render: () => (
    <div className="flex flex-col gap-xl">
      <div className="flex items-center gap-l">
        <IconButton icon={Search} label="Search" size="medium" />
        <IconButton icon={Bell} label="Notifications" size="large" />
        <IconButton icon={Menu} label="Menu" size="medium" />
        <span className="text-caption text-medium-grey">Header icons (ghost)</span>
      </div>
      <div className="flex items-center gap-l">
        <IconButton icon={Camera} label="Add photo" size="small" variant="primary" />
        <IconButton icon={Plus} label="Add a pet" size="medium" variant="outline" />
        <span className="text-caption text-medium-grey">Photo badge and add button</span>
      </div>
    </div>
  ),
}
