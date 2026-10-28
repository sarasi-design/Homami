import { Avatar } from '../basics/Avatar'

/**
 * ChatListItem — one chat on the Chats page: their photo (medium, 44px), name in Body Bold,
 * the last message on one line (Label, Medium grey; "You: …" when it was yours) and the time on the right.
 * Unread: the last message turns Dark grey and a Primary sage badge shows how many are new.
 * The whole row opens the chat. Rows are separated by a Light grey line.
 */
export interface ChatListItemProps {
  name: string
  photoUrl?: string | null
  lastMessage: string
  /** The last message was yours */
  fromMe?: boolean
  /** e.g. "14:32", "Yesterday" */
  when: string
  unread?: number
  onOpen?: () => void
}

export function ChatListItem({ name, photoUrl, lastMessage, fromMe, when, unread = 0, onOpen }: ChatListItemProps) {
  const hasUnread = unread > 0
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${name}${hasUnread ? `, ${unread} new` : ''}: ${fromMe ? 'You: ' : ''}${lastMessage}, ${when}`}
      className="flex w-full cursor-pointer items-center gap-m border-b border-light-grey py-m text-left transition-colors hover:bg-light-grey/50 active:bg-light-grey outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-sage"
    >
      <Avatar size="medium" name={name} src={photoUrl ?? undefined} />
      <span className="flex min-w-0 flex-1 flex-col gap-xs" aria-hidden>
        <span className="flex items-baseline justify-between gap-s">
          <span className="truncate text-body-bold text-dark-grey">{name}</span>
          <span className={hasUnread ? 'shrink-0 text-caption text-primary-sage' : 'shrink-0 text-caption text-medium-grey'}>{when}</span>
        </span>
        <span className="flex items-center justify-between gap-s">
          <span className={hasUnread ? 'truncate text-label text-dark-grey' : 'truncate text-label-light text-medium-grey'}>
            {fromMe && 'You: '}
            {lastMessage}
          </span>
          {hasUnread && (
            <span className="flex h-[20px] min-w-[20px] shrink-0 items-center justify-center rounded-pill bg-primary-sage px-xs text-[12px] font-semibold leading-none text-surface">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </span>
      </span>
    </button>
  )
}
