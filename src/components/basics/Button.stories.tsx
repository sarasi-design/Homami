import { Fragment } from 'react'
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

/** Icon-only buttons are perfect circles: every style at every size. */
export const IconOnly: Story = {
  name: 'Icon only',
  render: () => (
    <div className="grid grid-cols-[80px_repeat(5,max-content)] gap-l items-center">
      <span />
      {variants.map((v) => (
        <span key={v} className="text-caption text-medium-grey capitalize">{v}</span>
      ))}
      {(['large', 'medium', 'small'] as const).map((size) => (
        <Fragment key={size}>
          <span className="text-label-bold capitalize">
            {size}
            <span className="block text-caption text-medium-grey">{{ large: '44px', medium: '36px', small: '28px' }[size]}</span>
          </span>
          {variants.map((v) => (
            <IconButton key={v + size} icon={PawPrint} label="Example" size={size} variant={v} />
          ))}
        </Fragment>
      ))}
    </div>
  ),
}

/** Where the round icon buttons appear on real screens. */
export const IconOnlyInContext: Story = {
  name: 'Icon only in context',
  render: () => (
    <div className="flex flex-col gap-2xl w-[361px]">
      <div>
        <p className="text-overline text-medium-grey mb-s">Header</p>
        <div className="flex items-center gap-s">
          <div className="size-[44px] rounded-pill bg-soft-sage" aria-label="Your profile" />
          <div className="flex-1" />
          <IconButton icon={Search} label="Search" size="large" />
          <IconButton icon={Bell} label="Notifications" size="large" />
          <IconButton icon={Menu} label="Menu" size="large" />
        </div>
      </div>
      <div>
        <p className="text-overline text-medium-grey mb-s">Photo picker</p>
        <div className="relative size-[80px] rounded-pill bg-light-grey">
          <IconButton icon={Camera} label="Add photo" size="small" variant="primary" className="absolute right-0 bottom-0" />
        </div>
      </div>
      <div>
        <p className="text-overline text-medium-grey mb-s">Add a pet</p>
        <div className="flex items-center justify-between rounded-card border border-soft-grey p-l">
          <span className="text-body">Add a pet</span>
          <IconButton icon={Plus} label="Add a pet" size="medium" variant="outline" />
        </div>
      </div>
    </div>
  ),
}
