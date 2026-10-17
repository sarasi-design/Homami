import type { Meta, StoryObj } from '@storybook/react-vite'
import { Building2, CalendarDays, Cat, Dog, MapPin } from 'lucide-react'
import { DetailRow } from './DetailRow'

const meta: Meta<typeof DetailRow> = {
  title: 'Basics/Detail row',
  component: DetailRow,
  parameters: { options: { showPanel: false } },
  decorators: [(Story) => <div className="w-[329px]"><Story /></div>],
}
export default meta
type Story = StoryObj<typeof DetailRow>

/** Small (inside cards) and medium (on profiles). Bold the part people scan for. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-xl">
      <div className="flex flex-col gap-s">
        <p className="text-overline text-medium-grey">Small · 20px icon</p>
        <DetailRow icon={CalendarDays}>July 21 to August 2</DetailRow>
        <DetailRow icon={Building2}><strong>Torremolinos</strong>, Malaga</DetailRow>
      </div>
      <div className="flex flex-col gap-m">
        <p className="text-overline text-medium-grey">Medium · 24px icon</p>
        <DetailRow size="medium" icon={CalendarDays}>September 3, 2026</DetailRow>
        <DetailRow size="medium" icon={MapPin}>Up to <strong>30 km from Malaga Centro</strong></DetailRow>
      </div>
    </div>
  ),
}

/** Rows that open something get a chevron and a tap area of at least 44px. */
export const Tappable: Story = {
  render: () => (
    <div className="flex flex-col">
      <DetailRow icon={Dog} onClick={() => {}}><strong>Buddy</strong>, Senior dog, Special care</DetailRow>
      <DetailRow icon={Cat} onClick={() => {}}><strong>Mushroom</strong>, Adult cat</DetailRow>
    </div>
  ),
}

/** As in the Figma request card. */
export const InContext: Story = {
  name: 'In context: request card',
  render: () => (
    <div className="flex flex-col gap-s rounded-card border border-soft-grey p-l">
      <DetailRow icon={CalendarDays}>July 21 to August 2</DetailRow>
      <DetailRow icon={Building2}><strong>Torremolinos</strong>, Malaga</DetailRow>
      <DetailRow icon={Dog}><strong>Buddy</strong>, Senior dog, Needs special care</DetailRow>
      <DetailRow icon={Cat}><strong>Mushroom</strong>, Adult cat</DetailRow>
    </div>
  ),
}
