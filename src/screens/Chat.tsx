import { useEffect, useRef } from 'react'
import { Avatar } from '../components/basics/Avatar'
import { Note } from '../components/basics/Note'
import { Header } from '../components/blocks/Header'
import { EmptyState } from '../components/blocks/EmptyState'
import { ChatListItem } from '../components/blocks/ChatListItem'
import { ChatDay, MessageBubble } from '../components/blocks/MessageBubble'
import { MessageComposer } from '../components/blocks/MessageComposer'
import { chatDay, chatTime, messageTime } from '../lib/chat'
import type { ChatSummary, Message } from '../lib/chat'

/* ---------------------------------------------------------------------------------------------
 * Chats — the third tab (Figma bottom nav 129:8747). Newest chat first; unread ones stand out.
 * You start a chat from someone's profile (Message), so the empty state points there.
 * ------------------------------------------------------------------------------------------- */
export interface ChatsContentProps {
  chats: ChatSummary[] | undefined
  error?: string | null
  onOpen: (personId: string) => void
}

export function ChatsContent({ chats, error, onOpen }: ChatsContentProps) {
  return (
    <>
      <h1 className="text-title text-dark-grey">Chats</h1>
      {error ? (
        <Note title="Chats aren’t available right now">{error}</Note>
      ) : chats === undefined ? null : chats.length === 0 ? (
        <EmptyState title="No chats yet">
          Message people in your circle or a pet sitter from their profile. Your conversations will show up here.
        </EmptyState>
      ) : (
        <ul className="-mt-m flex flex-col">
          {chats.map((c) => (
            <li key={c.other_id}>
              <ChatListItem
                name={c.first_name ?? 'Homami member'}
                photoUrl={c.avatar_url}
                lastMessage={c.last_body}
                fromMe={c.last_from_me}
                when={chatTime(c.last_at)}
                unread={c.unread}
                onOpen={() => onOpen(c.other_id)}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

/* ---------------------------------------------------------------------------------------------
 * A chat with one person. Their photo and name at the top open their profile.
 * With a pet sitter you don't know yet, a note at the top suggests getting to know each other
 * before booking (Figma Chat+book: recommended, never blocking).
 * ------------------------------------------------------------------------------------------- */
export type ThreadMessage = Message & { status?: 'sending' | 'sent' | 'failed' }

export interface ChatThreadProps {
  me: string
  /** undefined while loading; null when they can't be found */
  person: { name: string; photoUrl?: string | null } | null | undefined
  messages: ThreadMessage[] | undefined
  /** Show the "before you book" tips (a pet sitter outside your circle) */
  showBookingTips?: boolean
  error?: string | null
  onSend: (text: string) => void
  onRetry: (message: ThreadMessage) => void
  onBack: () => void
  onOpenProfile?: () => void
}

/** Same person, within 5 minutes: only the last of those messages shows its time */
const together = (a: Message, b: Message | undefined) =>
  !!b && a.sender_id === b.sender_id && new Date(b.created_at).getTime() - new Date(a.created_at).getTime() < 5 * 60000

export function ChatThread({ me, person, messages, showBookingTips, error, onSend, onRetry, onBack, onOpenProfile }: ChatThreadProps) {
  const endRef = useRef<HTMLDivElement>(null)
  const count = messages?.length ?? 0

  // Keep the newest message in view
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [count])

  const name = person?.name ?? ''
  const header = person ? (
    <button
      type="button"
      onClick={onOpenProfile}
      disabled={!onOpenProfile}
      aria-label={`${name}’s profile`}
      className="flex min-w-0 cursor-pointer items-center gap-s rounded-pill pr-s outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-primary-sage disabled:cursor-default"
    >
      <Avatar size="medium" name={name} src={person.photoUrl ?? undefined} />
      <span className="truncate text-heading-name text-dark-grey">{name}</span>
    </button>
  ) : null

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[480px] flex-col bg-surface">
      <Header onBack={onBack} middle={header} />
      <div className="flex flex-1 flex-col gap-s overflow-y-auto px-l pt-s pb-l" aria-live="polite">
        {person === null ? (
          <Note title="This chat isn’t available">They may have left Homami.</Note>
        ) : (
          <>
            {showBookingTips && person && (
              <Note title={`Getting to know ${name}`}>
                Before you book, we suggest a video call, meeting up with your pet, and showing each other an ID. It’s up to you,
                but it helps you both feel sure.
              </Note>
            )}
            {messages && messages.length === 0 && person && (
              <p className="m-auto text-center text-label text-medium-grey">No messages yet. Say hi to {name}!</p>
            )}
            {messages?.map((m, i) => {
              const prev = messages[i - 1]
              const newDay = !prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString()
              return (
                <div key={m.id} className="flex flex-col gap-s">
                  {newDay && <ChatDay label={chatDay(m.created_at)} />}
                  <MessageBubble
                    body={m.body}
                    mine={m.sender_id === me}
                    time={messageTime(m.created_at)}
                    status={m.status}
                    showTime={!together(m, messages[i + 1])}
                    onRetry={() => onRetry(m)}
                  />
                </div>
              )
            })}
          </>
        )}
        <div ref={endRef} />
      </div>
      {error && (
        <p role="alert" className="px-l pb-s text-caption text-error">
          {error}
        </p>
      )}
      {person !== null && <MessageComposer placeholder={person ? `Message ${name}` : 'Write a message'} disabled={!person} onSend={onSend} />}
    </div>
  )
}
