import { useCallback, useEffect, useRef, useState } from 'react'
import type { ThreadMessage } from '../screens/Chat'
import { getMessages, markChatRead, onNewMessage, sendMessage } from '../lib/chat'
import { getPerson } from '../lib/circle'
import { getSitterProfile } from '../lib/sitters'

interface Options {
  /** Your chats changed (sent, or read): the Chats list loads again */
  onChanged: () => void
  /** Bookings between you two may have changed */
  onRefreshBookings: () => void
}

/**
 * One chat. Messages arrive straight away (and are checked again every 15 seconds, in case the
 * live connection drops). What you send shows at once, faded until it's saved; if it fails you can try again.
 */
export function useChatThread(me: string, otherId: string, { onChanged, onRefreshBookings }: Options) {
  const [person, setPerson] = useState<{ name: string; photoUrl: string | null } | null | undefined>(undefined)
  const [isSitter, setIsSitter] = useState(false)
  const [messages, setMessages] = useState<ThreadMessage[] | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const onChangedRef = useRef(onChanged)
  const onRefreshBookingsRef = useRef(onRefreshBookings)
  useEffect(() => {
    onChangedRef.current = onChanged
    onRefreshBookingsRef.current = onRefreshBookings
  })

  // Server messages, plus anything of yours still sending or failed
  const merge = useCallback((fromServer: ThreadMessage[]) => {
    setMessages((current) => [...fromServer, ...(current ?? []).filter((m) => m.status === 'sending' || m.status === 'failed')])
  }, [])

  const reload = useCallback(
    (markRead: boolean) =>
      getMessages(me, otherId)
        .then((list) => {
          merge(list)
          if (markRead && list.some((m) => m.sender_id === otherId && !m.read_at)) {
            markChatRead(otherId).then(() => onChangedRef.current())
          }
        })
        .catch((err) => {
          setMessages((m) => m ?? [])
          setError(err instanceof Error ? err.message : null)
        }),
    [me, otherId, merge],
  )

  useEffect(() => {
    let cancelled = false
    getPerson(otherId)
      .then((p) => !cancelled && setPerson(p ? { name: p.first_name ?? 'Homami member', photoUrl: p.avatar_url } : null))
      .catch(() => !cancelled && setPerson(null))
    getSitterProfile(otherId)
      .then((s) => !cancelled && setIsSitter(!!s))
      .catch(() => {})
    reload(true)
    onRefreshBookingsRef.current()
    const stop = onNewMessage(me, (m) => {
      if (m.sender_id !== otherId) return
      onRefreshBookingsRef.current()
      setMessages((list) => (list?.some((x) => x.id === m.id) ? list : [...(list ?? []), m]))
      markChatRead(otherId).then(() => onChangedRef.current())
    })
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      reload(true)
      onRefreshBookingsRef.current()
    }, 15000)
    return () => {
      cancelled = true
      stop()
      window.clearInterval(timer)
    }
  }, [me, otherId, reload])

  /** Shows the message straight away (faded), then saves it; if saving fails it's marked so you can try again */
  const send = (text: string) => {
    const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const draft: ThreadMessage = { id: localId, sender_id: me, recipient_id: otherId, body: text, created_at: new Date().toISOString(), read_at: null, status: 'sending' }
    setError(null)
    setMessages((list) => [...(list ?? []), draft])
    sendMessage(me, otherId, text)
      .then((saved) => {
        setMessages((list) => list?.map((m) => (m.id === localId ? saved : m)))
        onChangedRef.current()
      })
      .catch((err) => {
        setMessages((list) => list?.map((m) => (m.id === localId ? { ...m, status: 'failed' } : m)))
        setError(err instanceof Error ? err.message : null)
      })
  }

  const retry = (m: ThreadMessage) => {
    setMessages((list) => list?.filter((x) => x.id !== m.id))
    send(m.body)
  }

  return { person, isSitter, messages, error, send, retry }
}
