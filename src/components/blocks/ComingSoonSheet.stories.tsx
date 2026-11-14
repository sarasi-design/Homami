import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { House } from 'lucide-react'
import { userEvent, within } from 'storybook/test'
import { ComingSoonSheet } from './ComingSoonSheet'
import { Button } from '../basics/Button'

const meta: Meta = {
  title: 'Blocks/Coming soon sheet',
  // Not in Figma yet: built on Sheet for the "Stay in exchange for care" test (Sara, Nov 14, 2026)
  parameters: { layout: 'centered', options: { showPanel: false } },
  decorators: [(Story) => <div className="relative h-[600px] w-[393px] overflow-hidden rounded-[20px] border border-soft-grey bg-surface [transform:translateZ(0)]"><Story /></div>],
}
export default meta

function Demo() {
  const [open, setOpen] = useState(false)
  return (
    <div className="p-l">
      <Button variant="outline" size="small" onClick={() => setOpen(true)}>
        Stay in exchange for care
      </Button>
      <ComingSoonSheet open={open} onClose={() => setOpen(false)} icon={House} feature="Stay in exchange for care" />
    </div>
  )
}

/** Shown instead of picking something that isn't ready yet: in Set up pet sitter profile, Book and Create a request. */
export const Default: StoryObj = {
  name: 'Coming soon sheet',
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Stay in exchange for care' }))
  },
}
