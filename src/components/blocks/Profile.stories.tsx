import type { Meta, StoryObj } from '@storybook/react-vite'
import { Pencil } from 'lucide-react'
import { IconButton } from '../basics/Button'
import { ProfileHero } from './ProfileHero'
import { PetsSection } from './PetsSection'
import { sampleFace } from '../../stories-support/sampleFaces'

const meta: Meta = {
  title: 'Blocks/Profile hero and pets',
  parameters: { options: { showPanel: false } },
  decorators: [(Story) => <div className="w-[361px] bg-surface"><Story /></div>],
}
export default meta

/** Figma "Hero-infos" (4:729), v1: photo, name, city, bio and actions. */
export const Hero: StoryObj = {
  render: () => (
    <ProfileHero
      name="Eva Miller"
      photoUrl={sampleFace('Eva Miller')}
      city="Malaga, Spain"
      bio="Animal lover with two very spoiled dogs. Always happy to swap pet sitting with neighbours."
      editAction={<IconButton icon={Pencil} label="Edit profile" size="small" />}
    />
  ),
}

/** Before a bio is written, a grey prompt shows instead. */
export const HeroWithoutBio: StoryObj = {
  name: 'Hero without a bio',
  render: () => (
    <ProfileHero name="Sara" city="Málaga" bioPlaceholder="Introduce yourself with a short bio" editAction={<IconButton icon={Pencil} label="Edit profile" size="small" />} />
  ),
}

const somePets = [
  { id: '1', name: 'Berta', kindLabel: 'Dog', ageLabel: '4 years old', photoUrl: sampleFace('Berta', 3) },
  { id: '2', name: 'Sushy', kindLabel: 'Cat', ageLabel: '6 years old' },
  { id: '3', name: 'Pixel', kindLabel: 'Dog', ageLabel: '4 months' },
]

/** Compact: tap a pet to edit it. Adding is the + next to the title on Your profile. */
export const Pets: StoryObj = {
  name: 'Pets',
  render: () => <PetsSection onAdd={() => {}} onOpen={() => {}} pets={somePets} />,
}

/** No pets yet: Figma "Add Pet Section" (74:6937), the + tile straight away. */
export const NoPets: StoryObj = {
  name: 'Pets: none yet',
  render: () => <PetsSection onAdd={() => {}} pets={[]} />,
}
