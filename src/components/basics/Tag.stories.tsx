import { Fragment } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Cat, Dog, Users } from 'lucide-react'
import { Tag } from './Tag'

const meta: Meta<typeof Tag> = {
  title: 'Basics/Tag',
  component: Tag,
  args: { children: 'Soon available', color: 'gold', shape: 'round', size: 'medium' },
  argTypes: {
    color: { control: 'inline-radio', options: ['neutral', 'sage', 'gold', 'glicine', 'peach', 'salmon', 'bubble', 'plain'] },
    shape: { control: 'inline-radio', options: ['round', 'square'] },
    size: { control: 'inline-radio', options: ['medium', 'small'] },
    icon: { control: false },
  },
  parameters: {
    options: { showPanel: true },
    design: { type: 'figma', url: 'https://www.figma.com/design/SyIrJ3CngOXOHcBvhMSi8Q/Homami-app-v0?node-id=4-653' },
  },
}
export default meta
type Story = StoryObj<typeof Tag>

export const Playground: Story = {}

const colors = ['neutral', 'sage', 'gold', 'glicine', 'peach', 'salmon', 'bubble', 'plain'] as const

/** Every colour in both shapes and both sizes. */
export const AllStyles: Story = {
  name: 'All styles',
  render: () => (
    <div className="grid grid-cols-[120px_repeat(4,max-content)] gap-x-l gap-y-m items-center">
      <span />
      <span className="text-caption text-medium-grey">Round</span>
      <span className="text-caption text-medium-grey">Square</span>
      <span className="text-caption text-medium-grey">Round small</span>
      <span className="text-caption text-medium-grey">Square small</span>
      {colors.map((c) => (
        <Fragment key={c}>
          <span className="text-label-bold capitalize">{c}</span>
          <Tag color={c}>Label</Tag>
          <Tag color={c} shape="square">Label</Tag>
          <Tag color={c} size="small">Label</Tag>
          <Tag color={c} shape="square" size="small">Label</Tag>
        </Fragment>
      ))}
    </div>
  ),
}

/** How tags are used on real screens. */
export const InContext: Story = {
  name: 'In context',
  render: () => (
    <div className="flex w-[361px] flex-col gap-2xl">
      <div>
        <p className="text-overline text-medium-grey mb-s">Status next to a name</p>
        <div className="flex flex-wrap items-center gap-s">
          <span className="text-heading-name">Jimmy Chen</span>
          <Tag color="gold" size="small">Soon available</Tag>
        </div>
        <div className="mt-s flex flex-wrap items-center gap-s">
          <span className="text-heading-name">Ethan Brooks</span>
          <Tag color="peach" size="small">Not available</Tag>
        </div>
        <div className="mt-s flex flex-wrap items-center gap-s">
          <span className="text-heading-name">Noah Kim</span>
          <Tag color="bubble" size="small">Available</Tag>
        </div>
      </div>
      <div>
        <p className="text-overline text-medium-grey mb-s">Offers on a profile</p>
        <div className="flex flex-wrap gap-s">
          <Tag color="sage" shape="square">Pet sitting exchange</Tag>
          <Tag color="gold" shape="square">Pet sitting at your place</Tag>
          <Tag color="glicine" shape="square">Paid pet sitting</Tag>
        </div>
      </div>
      <div>
        <p className="text-overline text-medium-grey mb-s">Pet details</p>
        <div className="flex flex-wrap gap-s">
          <Tag shape="square" icon={Dog}>1 Dog</Tag>
          <Tag shape="square" icon={Cat}>2 Cats</Tag>
        </div>
      </div>
      <div>
        <p className="text-overline text-medium-grey mb-s">Count with an icon (plain)</p>
        <Tag color="plain" icon={Users}>28</Tag>
      </div>
    </div>
  ),
}
