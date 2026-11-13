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

/** A new post shows straight away, faded, until it's saved (like a chat message). */
export const Posting: StoryObj = {
  name: 'Post card: posting',
  parameters: { design: { type: 'figma', url: 'https://www.figma.com/design/SyIrJ3CngOXOHcBvhMSi8Q/Homami-app-v0?node-id=340-6248' } },
  render: () => <PostCard authorName="Sara" petName="Buddy" body="Buddy found the sunniest spot on the terrace." when="Just now" city="Málaga" status="posting" />,
}

/** Posting didn't work: a short note, Try again, or Remove. (A delete that didn't work shows the same note, with Try again.) */
export const NotPosted: StoryObj = {
  name: 'Post card: not posted',
  parameters: { design: { type: 'figma', url: 'https://www.figma.com/design/SyIrJ3CngOXOHcBvhMSi8Q/Homami-app-v0?node-id=340-6248' } },
  render: () => (
    <PostCard
      authorName="Sara"
      petName="Buddy"
      body="Buddy found the sunniest spot on the terrace."
      when="Just now"
      city="Málaga"
      status="failed"
      problem="We couldn’t reach Homami"
      onRetry={() => {}}
      onDiscard={() => {}}
      onDelete={() => {}}
    />
  ),
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
