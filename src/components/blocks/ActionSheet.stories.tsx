import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { LogOut } from 'lucide-react'
import { userEvent, within } from 'storybook/test'
import { ActionSheet } from './ActionSheet'
import { Button } from '../basics/Button'

const meta: Meta = {
  title: 'Blocks/Action sheet',
  parameters: { layout: 'centered', options: { showPanel: false } },
  decorators: [(Story) => <div className="relative h-[500px] w-[393px] overflow-hidden rounded-[20px] border border-soft-grey bg-surface [transform:translateZ(0)]"><Story /></div>],
}
export default meta

function Demo() {
  const [open, setOpen] = useState(false)
  return (
    <div className="p-l">
      <Button variant="outline" size="small" onClick={() => setOpen(true)}>
        Open menu
      </Button>
      <ActionSheet open={open} onClose={() => setOpen(false)} label="Profile menu" actions={[{ label: 'Log out', icon: LogOut, onSelect: () => {} }]} />
    </div>
  )
}

/** Slides up from the bottom. Used for the ≡ menu on Your profile (Log out). */
export const Default: StoryObj = {
  name: 'Action sheet',
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Open menu' }))
  },
}
