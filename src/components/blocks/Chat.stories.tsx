import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChatListItem } from './ChatListItem'
import { ChatDay, MessageBubble } from './MessageBubble'
import { MessageComposer } from './MessageComposer'
import { sampleFace } from '../../stories-support/sampleFaces'

const meta: Meta = {
  title: 'Blocks/Chat',
  parameters: { options: { showPanel: false } },
  decorators: [(Story) => <div className="w-[393px] bg-surface px-l"><Story /></div>],
}
export default meta

/** One row per chat on the Chats page. Unread chats get a darker last line and a sage badge. */
export const ChatList: StoryObj = {
  name: 'Chat list item',
  render: () => (
    <div>
      <ChatListItem name="Cleo" photoUrl={sampleFace('Cleo')} lastMessage="Yes! Which dates were you thinking of?" when="14:32" unread={2} />
      <ChatListItem name="Lena" lastMessage="Rayo can’t wait to see Buddy again" fromMe when="Yesterday" />
      <ChatListItem name="Daniel" photoUrl={sampleFace('Daniel')} lastMessage="Thanks, see you on Saturday" when="12 Oct" />
    </div>
  ),
}

/** Yours on the right in Dark sage, theirs on the left in Light grey. */
export const Bubbles: StoryObj = {
  name: 'Message bubbles',
  render: () => (
    <div className="flex flex-col gap-s py-l">
      <ChatDay label="Yesterday" />
      <MessageBubble body="Hi Cleo! Are you free to look after Buddy from 3 to 7 November?" mine time="18:04" />
      <MessageBubble body="Hi Sara, yes I am! Is Buddy ok with cats? I have one at home." time="18:20" />
      <ChatDay label="Today" />
      <MessageBubble body="He loves cats 😄" mine status="sending" time="09:12" />
      <MessageBubble body="Can we meet this week so he gets to know you?" mine status="failed" onRetry={() => {}} />
    </div>
  ),
}

function ComposerDemo() {
  const [sent, setSent] = useState<string[]>([])
  return (
    <div className="-mx-l flex flex-col gap-s">
      <div className="flex flex-col gap-s px-l">
        {sent.map((t, i) => (
          <MessageBubble key={i} body={t} mine time="now" />
        ))}
      </div>
      <MessageComposer placeholder="Message Cleo" onSend={(t) => setSent((l) => [...l, t])} />
    </div>
  )
}

/** The bar at the bottom of a chat. Type and press Enter or the send button. */
export const Composer: StoryObj = { name: 'Message composer', render: () => <ComposerDemo /> }
