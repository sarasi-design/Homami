import type { Meta, StoryObj } from '@storybook/react-vite'
import { Trash2 } from 'lucide-react'
import { userEvent, within } from 'storybook/test'
import { ConfirmAction } from './ConfirmAction'

const meta: Meta = { title: 'Blocks/Confirm action', parameters: { options: { showPanel: false } } }
export default meta

const wait = () => new Promise<void>((r) => setTimeout(r, 1200))

/** For things that can't be undone. Tap it: "Yes, …" and "Cancel" appear in the same spot. */
export const Default: StoryObj = {
  name: 'Delete (xsmall, in a post)',
  render: () => <ConfirmAction label="Delete" icon={Trash2} confirmLabel="Yes, delete" busyLabel="Deleting…" onConfirm={wait} />,
}

/** After the first tap. */
export const Confirming: StoryObj = {
  name: 'Asking to confirm',
  render: () => <ConfirmAction label="Delete" icon={Trash2} confirmLabel="Yes, delete" busyLabel="Deleting…" onConfirm={wait} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Delete' }))
  },
}

/** Small size, at the bottom of Edit pet. */
export const RemovePet: StoryObj = {
  name: 'Remove pet (small)',
  render: () => <ConfirmAction size="small" label="Remove pet" icon={Trash2} confirmLabel="Yes, remove Buddy" busyLabel="Removing…" onConfirm={wait} />,
}
