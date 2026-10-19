import type { Meta, StoryObj } from '@storybook/react-vite'
import { userEvent, within } from 'storybook/test'
import { AppMenu } from './AppMenu'
import { Header } from './Header'

const meta: Meta = {
  title: 'Blocks/App menu',
  parameters: { layout: 'centered', options: { showPanel: false } },
  decorators: [(Story) => <div className="relative h-[500px] w-[393px] overflow-hidden rounded-[20px] border border-soft-grey bg-surface [transform:translateZ(0)]"><Story /></div>],
}
export default meta

/** The ≡ button in the header of every main page. Tap it for Log out. */
export const InHeader: StoryObj = {
  name: 'In the header',
  render: () => <Header me={{ name: 'Sara', onOpen: () => {} }} actions={<AppMenu onLogOut={() => {}} />} />,
}

/** Opened. */
export const Open: StoryObj = {
  name: 'Open',
  render: () => <Header me={{ name: 'Sara', onOpen: () => {} }} actions={<AppMenu onLogOut={() => {}} />} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Menu' }))
  },
}
