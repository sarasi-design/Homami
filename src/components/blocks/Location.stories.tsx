import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { LocationField } from './LocationField'
import { SitterMap } from './SitterMap'
import { sampleNearbySitters, sampleMe } from '../../stories-support/sampleNearby'

const meta: Meta = {
  title: 'Blocks/Location',
  // The pin in the city field: Figma ONBOARDING "Let's set up your profile" (85:10570). The map has no Figma frame yet (Sara, Nov 15, 2026).
  parameters: { design: { type: 'figma', url: 'https://www.figma.com/design/SyIrJ3CngOXOHcBvhMSi8Q/Homami-app-v0?node-id=85-10570' } },
  decorators: [(Story) => <div className="max-w-[375px]">{Story()}</div>],
}
export default meta

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

function Field({ onLocate, located, onForget }: { onLocate?: () => Promise<{ place: string | null; note?: string }>; located?: string; onForget?: () => Promise<void> }) {
  const [city, setCity] = useState('')
  return <LocationField id="city" label="City" hideLabel placeholder="Add your city" value={city} onChange={setCity} onLocate={onLocate} located={located} onForget={onForget} />
}

/** Tap the pin: "Finding you…", then the city fills in and says how many sitters are near */
export const PinFindsYou: StoryObj = {
  name: 'Location field: tap the pin',
  render: () => (
    <Field
      onLocate={async () => {
        await wait(1200)
        return { place: 'Málaga', note: '4 pet sitters near you. Only your rough area is kept, never your address.' }
      }}
    />
  ),
}

export const PinDenied: StoryObj = {
  name: 'Location field: location turned off',
  render: () => (
    <Field
      onLocate={async () => {
        await wait(600)
        throw new Error('Location is turned off for Homami. Allow it in your browser settings, or type your city.')
      }}
    />
  ),
}

export const PinAlreadyLocated: StoryObj = {
  name: 'Location field: already located',
  render: () => <Field onLocate={async () => ({ place: 'Málaga' })} located="4 pet sitters near you" />,
}

export const PlainPin: StoryObj = {
  name: 'Location field: without finding you',
  render: () => <Field />,
}

function MapDemo({ withMe }: { withMe: boolean }) {
  const [selected, setSelected] = useState<string | null>(sampleNearbySitters[0].id)
  return <SitterMap className="h-[420px]" sitters={sampleNearbySitters} me={withMe ? sampleMe : null} selectedId={selected} onSelect={setSelected} />
}

export const Map: StoryObj = {
  name: 'Sitter map',
  render: () => <MapDemo withMe />,
}

export const MapWithoutYou: StoryObj = {
  name: 'Sitter map: without your location',
  render: () => <MapDemo withMe={false} />,
}

export const PinRemove: StoryObj = {
  name: 'Location field: located, with Remove my location',
  render: () => <Field onLocate={async () => ({ place: 'Málaga' })} located="Location added. Only your rough area is kept, never your address." onForget={async () => {
        await wait(600)
      }} />,
}
