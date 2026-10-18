import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { PhotoPicker } from './PhotoPicker'
import { sampleFace } from '../../stories-support/sampleFaces'

const meta: Meta = { title: 'Blocks/Photo picker', parameters: { options: { showPanel: false } } }
export default meta

function Live({ subject, currentUrl }: { subject: 'person' | 'pet'; currentUrl?: string }) {
  const [file, setFile] = useState<File | null>(null)
  const has = file || currentUrl
  return (
    <div className="w-[361px]">
      <PhotoPicker
        subject={subject}
        label={subject === 'pet' ? 'Pet picture' : 'Profile picture'}
        title={has ? 'Looking good!' : subject === 'pet' ? 'Add a picture of your pet' : 'Add a profile picture'}
        hint={has ? 'Tap the photo to choose a different one.' : 'It’s optional, but it helps your circle recognise you.'}
        file={file}
        currentUrl={currentUrl}
        onChange={setFile}
      />
    </div>
  )
}

/** Empty, for a person and for a pet. Tap the circle or the camera to choose a photo. */
export const Empty: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-xl">
      <Live subject="person" />
      <Live subject="pet" />
    </div>
  ),
}

/** With a photo: the camera stays on the bottom-right. */
export const WithPhoto: StoryObj = { name: 'With a photo', render: () => <Live subject="person" currentUrl={sampleFace('Sara')} /> }
