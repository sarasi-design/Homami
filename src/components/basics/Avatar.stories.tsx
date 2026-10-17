import type { Meta, StoryObj } from '@storybook/react-vite'
import { Avatar, AvatarGroup } from './Avatar'
import { Tag } from './Tag'
import { samplePeople } from '../../stories-support/sampleFaces'

const eva = samplePeople[0]

const meta: Meta<typeof Avatar> = {
  title: 'Basics/Avatar',
  component: Avatar,
  args: { name: eva.name, src: eva.src, size: 'medium', ring: false },
  argTypes: {
    size: { control: 'inline-radio', options: ['xlarge', 'large', 'medium', 'small'] },
    src: { control: false },
  },
  parameters: {
    options: { showPanel: true },
    design: { type: 'figma', url: 'https://www.figma.com/design/SyIrJ3CngOXOHcBvhMSi8Q/Homami-app-v0?node-id=2-11' },
  },
}
export default meta
type Story = StoryObj<typeof Avatar>

export const Playground: Story = {}

const sizes = [
  ['xlarge', '120px', 'Profile hero'],
  ['large', '80px', 'Photo picker, pet profile'],
  ['medium', '44px', 'Header, person cards'],
  ['small', '28px', 'Feed, shared circle'],
] as const

/** Every size, with a photo and without one. Faces here are placeholders; real photos come from users. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-xl">
      <div className="flex items-end gap-xl">
        {sizes.map(([size, px, use]) => (
          <div key={size} className="flex flex-col items-start gap-s">
            <Avatar name={eva.name} src={eva.src} size={size} />
            <p className="text-label-bold capitalize">{size} · {px}</p>
            <p className="text-caption text-medium-grey w-[120px]">{use}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="text-overline text-medium-grey mb-m">No photo: initials</p>
        <div className="flex items-end gap-xl">
          {sizes.map(([size]) => (
            <Avatar key={size} name="Vera Rodrigues" size={size} />
          ))}
        </div>
      </div>
    </div>
  ),
}

/** Overlapping avatars with a white ring. Extra people become a "+N" bubble. */
export const Group: Story = {
  render: () => (
    <div className="flex flex-col gap-l">
      <AvatarGroup people={samplePeople.slice(0, 4)} />
      <AvatarGroup people={samplePeople} max={5} />
      <AvatarGroup people={samplePeople} max={4} size="medium" />
    </div>
  ),
}

/** How avatars appear on real screens. */
export const InContext: Story = {
  name: 'In context',
  render: () => (
    <div className="flex w-[361px] flex-col gap-2xl">
      <div>
        <p className="text-overline text-medium-grey mb-s">Profile hero</p>
        <div className="flex items-center gap-l">
          <Avatar name={eva.name} src={eva.src} size="large" />
          <div className="flex flex-col items-start gap-xs">
            <span className="text-title-large">{eva.name}</span>
            <Tag color="gold" size="small">Soon available</Tag>
          </div>
        </div>
      </div>
      <div>
        <p className="text-overline text-medium-grey mb-s">Shared circle</p>
        <div className="flex w-fit items-center gap-s rounded-small border border-soft-grey p-s">
          <span className="text-label">Shared circle</span>
          <span className="text-title text-dark-sage">8</span>
          <AvatarGroup people={samplePeople} max={5} />
        </div>
      </div>
      <div>
        <p className="text-overline text-medium-grey mb-s">Feed item</p>
        <div className="flex items-center gap-xs">
          <Avatar name="Vera Rodrigues" src={samplePeople[2].src} size="small" />
          <span className="text-body-bold">Vera</span>
          <span className="text-body text-medium-grey">looked after</span>
          <span className="text-body-bold">Luna</span>
        </div>
      </div>
    </div>
  ),
}
