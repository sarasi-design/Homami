import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { AppLayout } from './AppLayout'
import { ChatThread, ChatsContent } from './Chat'
import type { ThreadMessage } from './Chat'
import type { ChatSummary } from '../lib/chat'
import { sampleFace } from '../stories-support/sampleFaces'

const meta: Meta = {
  title: 'Screens/Chat',
  parameters: { layout: 'centered', options: { showPanel: false } },
  decorators: [
    (Story) => (
      <div className="relative h-[852px] w-[393px] overflow-y-auto rounded-[20px] border border-soft-grey bg-surface [transform:translateZ(0)] [&>div]:min-h-full [&>div]:h-full">
        <Story />
      </div>
    ),
  ],
}
export default meta

const me = { name: 'Sara', photoUrl: sampleFace('Sara') }
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600e3).toISOString()

const chats: ChatSummary[] = [
  { other_id: 'c', first_name: 'Cleo', avatar_url: sampleFace('Cleo'), last_body: 'Yes! Which dates were you thinking of?', last_at: hoursAgo(0.2), last_from_me: false, unread: 2 },
  { other_id: 'l', first_name: 'Lena', avatar_url: null, last_body: 'Rayo can’t wait to see Buddy again', last_at: hoursAgo(26), last_from_me: true, unread: 0 },
  { other_id: 'd', first_name: 'Daniel', avatar_url: sampleFace('Daniel'), last_body: 'Thanks, see you on Saturday', last_at: hoursAgo(24 * 9), last_from_me: false, unread: 0 },
]

/** The third tab. Newest chat first; the badge on Chats counts chats with unread messages. */
export const Chats: StoryObj = {
  name: 'Chats',
  render: () => (
    <AppLayout me={me} tab="chats" unreadChats={1} onTab={() => {}} onOpenProfile={() => {}} onLogOut={() => {}}>
      <ChatsContent chats={chats} onOpen={() => {}} />
    </AppLayout>
  ),
}

/** Before your first message. */
export const NoChats: StoryObj = {
  name: 'Chats: empty',
  render: () => (
    <AppLayout me={me} tab="chats" onTab={() => {}} onOpenProfile={() => {}} onLogOut={() => {}}>
      <ChatsContent chats={[]} onOpen={() => {}} />
    </AppLayout>
  ),
}

const SARA = 'sara'
const CLEO = 'cleo'
const msg = (id: string, from: string, body: string, h: number): ThreadMessage => ({
  id,
  sender_id: from,
  recipient_id: from === SARA ? CLEO : SARA,
  body,
  created_at: hoursAgo(h),
  read_at: null,
})

function ThreadDemo({ tips, start }: { tips: boolean; start: ThreadMessage[] }) {
  const [messages, setMessages] = useState(start)
  return (
    <ChatThread
      me={SARA}
      person={{ name: 'Cleo', photoUrl: sampleFace('Cleo') }}
      messages={messages}
      showBookingTips={tips}
      onSend={(text) => setMessages((l) => [...l, { ...msg(`n${l.length}`, SARA, text, 0) }])}
      onRetry={() => {}}
      onBack={() => {}}
      onOpenProfile={() => {}}
    />
  )
}

/**
 * A chat with a pet sitter you don't know yet: the note at the top suggests getting to know each
 * other before booking (recommended, not required). Type a message to try it.
 */
export const WithSitter: StoryObj = {
  name: 'Chat with a pet sitter',
  render: () => (
    <ThreadDemo
      tips
      start={[
        msg('1', SARA, 'Hi Cleo! Are you free to look after Buddy from 3 to 7 November?', 26),
        msg('2', CLEO, 'Hi Sara, yes I am! Is Buddy ok with cats? I have one at home.', 25.6),
        msg('3', SARA, 'He loves cats 😄', 0.5),
        msg('4', SARA, 'Could we meet this week so he gets to know you?', 0.49),
        msg('5', CLEO, 'Sure! Thursday afternoon at the park?', 0.2),
      ]}
    />
  ),
}

/** The first time you open a chat. */
export const NewChat: StoryObj = {
  name: 'New chat',
  render: () => <ThreadDemo tips={false} start={[]} />,
}
