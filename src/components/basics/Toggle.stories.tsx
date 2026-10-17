import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Toggle } from './Toggle'

const meta: Meta<typeof Toggle> = {
  title: 'Basics/Toggle',
  component: Toggle,
  parameters: {
    options: { showPanel: false },
    design: { type: 'figma', url: 'https://www.figma.com/design/SyIrJ3CngOXOHcBvhMSi8Q/Homami-app-v0?node-id=150-6500' },
  },
}
export default meta
type Story = StoryObj<typeof Toggle>

function Live(props: { initial: boolean; disabled?: boolean; label?: string; description?: string }) {
  const [on, setOn] = useState(props.initial)
  return (
    <Toggle
      checked={on}
      onChange={setOn}
      disabled={props.disabled}
      label={props.label}
      description={props.description}
      aria-label={props.label ? undefined : 'Example switch'}
    />
  )
}

/** Click them. The off state uses Medium grey so it stays clearly visible. */
export const States: Story = {
  render: () => (
    <div className="grid grid-cols-[100px_max-content] items-center gap-l">
      <span className="text-label-bold">On</span><Live initial />
      <span className="text-label-bold">Off</span><Live initial={false} />
      <span className="text-label-bold">Disabled on</span><Live initial disabled />
      <span className="text-label-bold">Disabled off</span><Live initial={false} disabled />
    </div>
  ),
}

/** As in the Figma sitter services list. */
export const InContext: Story = {
  name: 'In context: with a label',
  render: () => (
    <div className="flex w-[361px] flex-col gap-l rounded-card border border-soft-grey p-l">
      <Live initial label="Stay in exchange for care" description="You care for the pets, the stay is your payment. No fees." />
      <div className="h-px bg-light-grey" />
      <Live initial={false} label="Pet sitting exchange" description="You look after someone's pet, they look after yours next time. No fees." />
    </div>
  ),
}
