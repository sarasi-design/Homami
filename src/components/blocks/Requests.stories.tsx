import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Pencil } from 'lucide-react'
import { IconButton } from '../basics/Button'
import { MonthCalendar } from './MonthCalendar'
import { PetPicker } from './PetPicker'
import { RequestCard } from './RequestCard'
import { sampleFace } from '../../stories-support/sampleFaces'
import { sampleRequest } from '../../stories-support/sampleRequest'

const meta: Meta = {
  title: 'Blocks/Pet care requests',
  parameters: { options: { showPanel: false } },
  decorators: [(Story) => <div className="w-[361px] bg-surface"><Story /></div>],
}
export default meta

const buddy = { id: '1', name: 'Buddy', kindLabel: 'Dog', ageLabel: '9 years old', photoUrl: sampleFace('Buddy', 3) }
const mushroom = { id: '2', name: 'Mushroom', kindLabel: 'Cat', ageLabel: '2 years old' }

/** Figma 91:6973. The request as everyone sees it: what's needed, when, where and for which pets. */
export const Card: StoryObj = {
  name: 'Request card',
  render: () => (
    <RequestCard title="Eva needs" needs={sampleRequest.needs} startDate={sampleRequest.start_date} endDate={sampleRequest.end_date} area={sampleRequest.area} pets={[buddy]} />
  ),
  parameters: { design: { type: 'figma', url: 'https://www.figma.com/design/SyIrJ3CngOXOHcBvhMSi8Q/Homami-app-v0?node-id=91-6973' } },
}

/** On your own profile: a pencil top-right to edit it. Several kinds of care, two pets. */
export const OnYourProfile: StoryObj = {
  name: 'Request card on your profile',
  render: () => (
    <RequestCard
      title="You need"
      needs={['dog_walking', 'boarding']}
      startDate={sampleRequest.start_date}
      endDate={sampleRequest.start_date}
      area="Málaga Centro"
      pets={[buddy, mushroom]}
      action={<IconButton icon={Pencil} label="Edit this request" size="small" />}
    />
  ),
}

/** Someone outside their circle can't see their pets (pets stay private), so it says how many. */
export const PetsHidden: StoryObj = {
  name: 'Request card, pets not visible',
  render: () => (
    <RequestCard title="Vera needs" needs={['live_in', 'training']} startDate={sampleRequest.start_date} endDate={sampleRequest.end_date} area="Torremolinos, Málaga" petCount={2} />
  ),
}

function RangeDemo() {
  const [range, setRange] = useState<{ start: string | null; end: string | null }>({ start: sampleRequest.start_date, end: sampleRequest.end_date })
  return <MonthCalendar mode="range" label="When you need care" start={range.start} end={range.end} onRangeChange={(start, end) => setRange({ start, end })} />
}
/**
 * Figma 90:6520. Tap the first day, then the last. Tapping before the first day starts again from there;
 * a tap once both are set starts a new range. Days between are Light sage.
 */
export const CalendarRange: StoryObj = { name: 'Month calendar, date range', render: () => <RangeDemo /> }

function PetsDemo() {
  const [ids, setIds] = useState<string[]>(['1'])
  return <PetPicker multiple label="Who do you need care for?" pets={[buddy, mushroom, { id: '3', name: 'Pixel' }]} values={ids} onChangeMany={setIds} />
}
/** Pick any number of pets; each tap turns one on or off. */
export const PickSeveralPets: StoryObj = { name: 'Pet picker, several pets', render: () => <PetsDemo /> }
