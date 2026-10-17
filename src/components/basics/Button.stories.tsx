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
    size: { control: 'inline-radio', options: ['medium', 'small', 'xsmall'] },
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
        <Button key={v} variant={v}>Medium</Button>
      ))}
      {variants.map((v) => (
        <Button key={v + '-icon'} variant={v} iconLeft={PawPrint}>Label</Button>
      ))}
      {variants.map((v) => (
        <Button key={v + '-small'} variant={v} size="small">Small</Button>
      ))}
      {variants.map((v) => (
        <Button key={v + '-xsmall'} variant={v} size="xsmall">Xsmall</Button>
      ))}
      {variants.map((v) => (
        <Button key={v + '-disabled'} variant={v} disabled>Label</Button>
      ))}
    </div>
  ),
}

const states = [
  ['Rest', undefined],
  ['Hover', 'hover'],
  ['Pressed', 'pressed'],
  ['Keyboard focus', 'focus'],
] as const

/** Every style in every state. Hover and press for real on the Playground too. */
export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-2xl">
      <div className="grid grid-cols-[110px_repeat(5,max-content)] gap-x-l gap-y-m items-center">
        <span />
        {variants.map((v) => (
          <span key={v} className="text-caption text-medium-grey capitalize">{v}</span>
        ))}
        {states.map(([label, state]) => (
          <Fragment key={label}>
            <span className="text-label-bold">{label}</span>
            {variants.map((v) => (
              <Button key={v + label} variant={v} data-state={state} tabIndex={-1}>Label</Button>
            ))}
          </Fragment>
        ))}
        <span className="text-label-bold">Disabled</span>
        {variants.map((v) => (
          <Button key={v + 'disabled'} variant={v} disabled>Label</Button>
        ))}
      </div>
      <div className="grid grid-cols-[110px_repeat(5,max-content)] gap-x-l gap-y-m items-center">
        <span />
        {variants.map((v) => (
          <span key={v} className="text-caption text-medium-grey capitalize">{v}</span>
        ))}
        {states.map(([label, state]) => (
          <Fragment key={label}>
            <span className="text-label-bold">{label}</span>
            {variants.map((v) => (
              <IconButton key={v + label} icon={PawPrint} label="Example" variant={v} data-state={state} tabIndex={-1} />
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  ),
}

/** How the buttons appear on real screens. */
export const InContext: Story = {
  name: 'In context',
  render: () => (
    <div className="flex flex-col gap-xl w-[361px]">
      <div>
        <p className="text-overline text-medium-grey mb-s">Inside a person card (small)</p>
        <div className="flex gap-m rounded-card border border-soft-grey p-l">
          <Button variant="outline" size="small" fullWidth>Add to Circle</Button>
          <Button size="small" fullWidth>Chat</Button>
        </div>
      </div>
      <div>
        <p className="text-overline text-medium-grey mb-s">Banner</p>
        <div className="flex items-center justify-between gap-l rounded-card bg-pale-bubble p-l">
          <p className="text-body-bold text-dark-sage">Want to be a sitter?</p>
          <Button variant="dark">Create a profile</Button>
        </div>
      </div>
      <div>
        <p className="text-overline text-medium-grey mb-s">Bottom of a setup screen</p>
        <div className="flex justify-center gap-m">
          <Button variant="outline">Not now</Button>
          <Button>Save pet</Button>
        </div>
      </div>
      <div>
        <p className="text-overline text-medium-grey mb-s">Dense row (xsmall)</p>
        <div className="flex items-center justify-between rounded-card border border-soft-grey p-l">
          <span className="text-body">Overnight stay</span>
          <Button size="xsmall" variant="outline">Set price</Button>
        </div>
      </div>
      <div>
        <p className="text-overline text-medium-grey mb-s">With an icon</p>
        <Button variant="neutral" iconRight={Share2}>Share</Button>
      </div>
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
      {(['medium', 'small', 'xsmall'] as const).map((size) => (
        <Fragment key={size}>
          <span className="text-label-bold capitalize">
            {size}
            <span className="block text-caption text-medium-grey">{{ medium: '44px', small: '36px', xsmall: '30px' }[size]}</span>
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
          <IconButton icon={Search} label="Search" size="medium" />
          <IconButton icon={Bell} label="Notifications" size="medium" />
          <IconButton icon={Menu} label="Menu" size="medium" />
        </div>
      </div>
      <div>
        <p className="text-overline text-medium-grey mb-s">Photo picker</p>
        <div className="relative size-[80px] rounded-pill bg-light-grey">
          <IconButton icon={Camera} label="Add photo" size="xsmall" variant="primary" className="absolute right-0 bottom-0" />
        </div>
      </div>
      <div>
        <p className="text-overline text-medium-grey mb-s">Add a pet</p>
        <div className="flex items-center justify-between rounded-card border border-soft-grey p-l">
          <span className="text-body">Add a pet</span>
          <IconButton icon={Plus} label="Add a pet" size="small" variant="outline" />
        </div>
      </div>
    </div>
  ),
}
