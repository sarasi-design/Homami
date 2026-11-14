import type { Meta, StoryObj } from '@storybook/react-vite'
import { StatTile } from './StatTile'

const meta: Meta<typeof StatTile> = {
  title: 'Blocks/Stat tile',
  component: StatTile,
  // Not in Figma yet: for the Homami team page (Sara, Nov 14, 2026)
  parameters: { layout: 'centered' },
  decorators: [(Story) => <div className="grid w-[361px] grid-cols-2 gap-s"><Story /></div>],
}
export default meta

export const Default: StoryObj<typeof StatTile> = { args: { value: 24, label: 'Members', detail: '+3 this week' } }
export const NoDetail: StoryObj<typeof StatTile> = { name: 'Without detail', args: { value: 7, label: 'Pets' } }
