import type { Meta, StoryObj } from '@storybook/react-vite'
import { Note } from './Note'
import { TextLink } from './TextLink'

const meta: Meta = { title: 'Basics/Note and text link', parameters: { options: { showPanel: false } } }
export default meta

/** The pale blue info box. With or without a bold first line. */
export const Notes: StoryObj = {
  render: () => (
    <div className="flex w-[361px] flex-col gap-l">
      <Note title="Add a picture of your pet">Can’t wait to see how cute they are!</Note>
      <Note>Only priced services will be displayed in your profile</Note>
    </div>
  ),
}

/** A tappable word inside a sentence. 44px tall tap area. */
export const TextLinks: StoryObj = {
  name: 'Text link',
  render: () => (
    <p className="text-label text-medium-grey">
      Already have an account? <TextLink>Log in</TextLink>
    </p>
  ),
}
