import type { Meta, StoryObj } from '@storybook/react-vite'
import { Pencil } from 'lucide-react'
import { Button } from '../basics/Button'
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
      actions={<Button variant="outline" size="small" iconLeft={Pencil}>Edit profile</Button>}
    />
  ),
}

/** Before a bio is written, a grey prompt shows instead. */
export const HeroWithoutBio: StoryObj = {
  name: 'Hero without a bio',
  render: () => (
    <ProfileHero name="Sara" city="Málaga" bioPlaceholder="Introduce yourself with a short bio" actions={<Button variant="outline" size="small" iconLeft={Pencil}>Edit profile</Button>} />
  ),
}

/** Figma "Add Pet Section" (74:6937). The + tile adds another pet. */
export const Pets: StoryObj = {
  render: () => (
    <PetsSection
      onAdd={() => {}}
      pets={[{ id: '1', name: 'Buddy', kindLabel: 'Dog', ageLabel: '9 years old', photoUrl: sampleFace('Buddy', 3) }]}
    />
  ),
}

/** With several pets the tiles wrap onto new lines. */
export const SeveralPets: StoryObj = {
  name: 'Several pets',
  render: () => (
    <PetsSection
      onAdd={() => {}}
      pets={[
        { id: '1', name: 'Buddy', kindLabel: 'Dog', ageLabel: '9 years old' },
        { id: '2', name: 'Mushroom', kindLabel: 'Cat', ageLabel: '2 years old' },
        { id: '3', name: 'Pixel', kindLabel: 'Dog', ageLabel: '4 months' },
      ]}
    />
  ),
}
