import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Footprints, Handshake, Moon, Sun } from 'lucide-react'
import { SelectableTag } from '../basics/SelectableTag'
import { MonthCalendar } from './MonthCalendar'
import { PriceServiceCard, ToggleServiceCard } from './ServiceCard'
import { OffersSection } from './OffersSection'
import { SitterPostCard } from './SitterPostCard'
import { OFFERS } from '../../lib/sitters'
import { sampleFace } from '../../stories-support/sampleFaces'
import { sampleSitter } from '../../stories-support/sampleSitter'

const meta: Meta = {
  title: 'Blocks/Pet sitting',
  parameters: { options: { showPanel: false } },
  decorators: [(Story) => <div className="w-[361px] bg-surface"><Story /></div>],
}
export default meta

function TagsDemo() {
  const [on, setOn] = useState<string[]>(['live_in'])
  return (
    <div className="flex flex-wrap gap-s">
      {OFFERS.map((o) => (
        <SelectableTag key={o.id} label={o.label} color={o.color} selected={on.includes(o.id)} onChange={(v) => setOn((l) => (v ? [...l, o.id] : l.filter((x) => x !== o.id)))} />
      ))}
    </div>
  )
}
/** Figma 163:6981. Tap to pick what you offer: off = white with +, on = its pastel colour with a check. */
export const SelectableTags: StoryObj = { name: 'Selectable tags', render: () => <TagsDemo /> }

function CalendarDemo() {
  const [date, setDate] = useState<string | null>(null)
  return <MonthCalendar label="Available from" value={date} onChange={setDate} />
}
/** Figma "Availability calendar". Pick a day; tap it again to clear. Past days can't be picked. */
export const Calendar: StoryObj = { name: 'Month calendar', render: () => <CalendarDemo /> }

function ServicesDemo() {
  const [daily, setDaily] = useState<number | null>(null)
  const [night, setNight] = useState<number | null>(35)
  const [walk, setWalk] = useState<number | null>(null)
  const [stay, setStay] = useState(true)
  const [swap, setSwap] = useState(false)
  return (
    <div className="flex flex-col gap-m">
      <PriceServiceCard icon={Sun} title="Daily rate" description="Daytime care only, no overnight" unit="day" price={daily} onChange={setDaily} />
      <PriceServiceCard icon={Moon} title="Overnight stay" description="Sleep there every night of the booking" unit="night" price={night} onChange={setNight} />
      <PriceServiceCard icon={Footprints} title="Dog walking" description="Walks or home visits, priced per hour" unit="hour" price={walk} onChange={setWalk} />
      <ToggleServiceCard id="s1" icon={Sun} title="Stay in exchange for care" description="You care for the pets — the stay is your payment. No fees." checked={stay} onChange={setStay} />
      <ToggleServiceCard id="s2" icon={Handshake} title="Pet sitting exchange" description="You look after someone’s pet, they look after yours next time. No fees." checked={swap} onChange={setSwap} />
    </div>
  )
}
/** Figma "Service & prices" (91:10326). Set price → € field → Save price → "35 € / night" with Edit. */
export const Services: StoryObj = { name: 'Service cards', render: () => <ServicesDemo /> }

/** Figma "Offers- Section" (127:9167): on a sitter's profile. Only priced services are listed. */
export const Offers: StoryObj = { name: 'Offers section', render: () => <OffersSection sitter={sampleSitter} /> }

/** A pet sitter on the wall, between posts: a sage border so it reads differently from a post. */
export const Card: StoryObj = {
  name: 'Sitter card on the wall',
  render: () => (
    <div className="flex flex-col gap-l">
      <SitterPostCard name="Lena" photoUrl={sampleFace('Lena Morales')} relation="In your circle" availability="Available now" offers={['dog_walking', 'boarding']} price="From 9 €" />
      <SitterPostCard name="Daniel" photoUrl={sampleFace('Daniel Medina')} relation="Near you · Málaga" availability="Available from 3 Nov" offers={['accommodation_exchange']} price="Exchange, no fees" />
    </div>
  ),
}
