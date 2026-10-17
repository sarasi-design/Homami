import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Logo } from './Logo'
import { Button } from '../basics/Button'

const meta: Meta<typeof Logo> = {
  title: 'Basics/Logo',
  component: Logo,
  parameters: { layout: 'centered', options: { showPanel: false } },
}
export default meta
type Story = StoryObj<typeof Logo>

function Replayable() {
  const [run, setRun] = useState(0)
  return (
    <div className="flex flex-col items-center gap-2xl">
      <Logo key={run} animated width={90} />
      <Button variant="outline" size="small" onClick={() => setRun((n) => n + 1)}>
        Replay
      </Button>
    </div>
  )
}

/** The intro on Sign up and Log in: it draws itself, smiles, and the heart beats twice. Tap Replay to watch again. */
export const Animated: Story = { render: () => <Replayable /> }

/** Without the animation, e.g. in small places. */
export const Still: Story = { args: { width: 45 } }
