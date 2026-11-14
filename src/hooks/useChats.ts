import { useEffect } from 'react'
import { listChats, onNewMessage } from '../lib/chat'
import type { ChatSummary } from '../lib/chat'
import { useLoader } from './useLoader'
import { useOnAppVisible } from './useOnAppVisible'

/** Your chats: loaded, and loaded again when a message arrives, when you come back to the app, and on the Chats tab */
export function useChats(userId: string, route: string) {
  const { data: chats, error, refresh } = useLoader<ChatSummary[]>(listChats, [])
  useEffect(() => {
    refresh()
    return onNewMessage(userId, () => void refresh())
  }, [userId, refresh])
  useOnAppVisible(refresh)
  useEffect(() => {
    if (route === '/chats') refresh()
  }, [route, refresh])
  /** How many chats have messages you haven't read (the badge on Chats) */
  const unread = chats?.filter((c) => c.unread > 0).length ?? 0
  return { chats, error, refresh, unread }
}
