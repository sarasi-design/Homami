import type { Meta, StoryObj } from '@storybook/react-vite'
import { EmptyState } from './EmptyState'
import dogStill from '../../assets/empty-dog-rug.webp'

const meta: Meta = {
  title: 'Blocks/Empty state',
  parameters: { options: { showPanel: false } },
  decorators: [(Story) => <div className="w-[361px] bg-surface"><Story /></div>],
}
export default meta

/** When a list has nothing in it yet. Illustration from Figma "No activity to show": the dog under the rug, moving once, then still (Nov 16, 2026). Reload the story to see it again. */
export const Default: StoryObj = {
  name: 'With illustration',
  render: () => <EmptyState title="Nothing here yet">Share the first update about your pets. People in your circle will see it here.</EmptyState>,
}

/** Without the picture, when something else on the page already has one (e.g. the invite banner). */
export const NoImage: StoryObj = {
  name: 'Without illustration',
  render: () => <EmptyState title="Your circle is empty for now" image={null}>Invite friends and family you trust.</EmptyState>,
}

/** With "reduce motion" turned on in the phone's settings: the same dog, still. */
export const StillForReducedMotion: StoryObj = {
  name: 'With illustration, still (reduce motion)',
  render: () => (
    <EmptyState title="Nothing here yet" image={dogStill}>
      Share the first update about your pets. People in your circle will see it here.
    </EmptyState>
  ),
}
