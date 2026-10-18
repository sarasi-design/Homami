import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { PostCard } from './PostCard'
import { ComposerPrompt } from './ComposerPrompt'
import { PetPicker } from './PetPicker'
import { PhotoField } from './PhotoField'
import { sampleFace } from '../../stories-support/sampleFaces'

const meta: Meta = {
  title: 'Blocks/Wall',
  parameters: { options: { showPanel: false } },
  decorators: [(Story) => <div className="w-[361px] bg-surface"><Story /></div>],
}
export default meta

/** Figma "Activity--Card-2" (340:6248), v1: someone shared about their pet. */
export const Post: StoryObj = {
  name: 'Post card',
  render: () => (
    <PostCard authorName="Lena" authorPhotoUrl={sampleFace('Lena Morales')} petName="Rayo" body="Rayo discovered the beach today and refused to leave until sunset." when="2h ago" city="Málaga" />
  ),
}

/** Your own post: Delete asks once to confirm. */
export const OwnPost: StoryObj = {
  name: 'Post card: your own',
  render: () => <PostCard authorName="Sara" petName="Buddy" body="Buddy found the sunniest spot on the terrace." when="Just now" city="Málaga" onDelete={() => new Promise((r) => setTimeout(r, 800))} />,
}

/** The line at the top of the wall that opens New post. */
export const Composer: StoryObj = { name: 'What’s new prompt', render: () => <ComposerPrompt name="Sara" photoUrl={sampleFace('Sara')} onOpen={() => {}} /> }

function PickerDemo() {
  const [value, setValue] = useState<string | null>('1')
  return <PetPicker label="Who is it about?" value={value} onChange={setValue} pets={[{ id: '1', name: 'Buddy', photoUrl: sampleFace('Buddy', 3) }, { id: '2', name: 'Mushroom' }, { id: '3', name: 'Pixel' }]} />
}

/** Choose which pet a post is about. Tap again to unselect. */
export const Picker: StoryObj = { name: 'Pet picker', render: () => <PickerDemo /> }

function PhotoDemo() {
  const [file, setFile] = useState<File | null>(null)
  return <PhotoField file={file} onChange={setFile} />
}

/** The big photo of a post. Tap to choose one. */
export const Photo: StoryObj = { name: 'Photo field', render: () => <PhotoDemo /> }
