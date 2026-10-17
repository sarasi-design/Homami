import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tabs } from './Tabs'

const meta: Meta<typeof Tabs> = {
  title: 'Basics/Tabs',
  component: Tabs,
  parameters: {
    options: { showPanel: false },
    design: { type: 'figma', url: 'https://www.figma.com/design/SyIrJ3CngOXOHcBvhMSi8Q/Homami-app-v0?node-id=15-1571' },
  },
}
export default meta
type Story = StoryObj<typeof Tabs>

function Live({ tabs, label }: { tabs: { id: string; label: string }[]; label: string }) {
  const [value, setValue] = useState(tabs[0].id)
  return (
    <div className="flex flex-col gap-l">
      <Tabs tabs={tabs} value={value} onChange={setValue} label={label} />
      <div id={`panel-${value}`} role="tabpanel" aria-labelledby={`tab-${value}`} className="rounded-small bg-pale-bubble p-l text-label text-medium-grey">
        {tabs.find((t) => t.id === value)?.label} content goes here
      </div>
    </div>
  )
}

/** Profile sections. Click a tab, or use the arrow keys after tabbing into it. */
export const Profile: Story = {
  render: () => (
    <Live
      label="Profile sections"
      tabs={[
        { id: 'about', label: 'About' },
        { id: 'schedule', label: 'Schedule' },
        { id: 'reviews', label: 'Reviews' },
      ]}
    />
  ),
}

/** Two tabs, as on the Circle screen. */
export const Circle: Story = {
  render: () => (
    <Live
      label="Circle"
      tabs={[
        { id: 'your', label: 'Your circle' },
        { id: 'extended', label: 'Extended circle' },
      ]}
    />
  ),
}
