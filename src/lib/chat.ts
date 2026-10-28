import { supabase } from './supabase'

/**
 * Chat (database script 09): one-to-one messages.
 * You can start a chat with people in your circle and with pet sitters, and reply to anyone who wrote to you.
 */

export interface Message {
  id: string
  sender_id: string
  recipient_id: string
  body: string
  created_at: string
  read_at: string | null
}

/** One row on the Chats page */
export interface ChatSummary {
  other_id: string
  first_name: string | null
  avatar_url: string | null
  last_body: string
  last_at: string
  last_from_me: boolean
  unread: number
}

const offline = 'We couldn’t reach Homami. Check your connection and try again.'
/** A missing table or function means setup script 09 hasn't been run yet. */
const needsUpdate = 'Homami’s database needs an update for chat (setup script 09). Please try again later.'
const notAllowed = 'You can message people in your circle and pet sitters.'
const friendly = (error: { code?: string; message?: string }) => {
  if (error.code === '42501' || /row-level security/i.test(error.message ?? '')) return notAllowed
  if (['42P01', '42883', 'PGRST202', 'PGRST205'].includes(error.code ?? '') || /relation|function|schema cache/i.test(error.message ?? ''))
    return needsUpdate
  return offline
}

export async function listChats(): Promise<ChatSummary[]> {
  const { data, error } = await supabase.rpc('my_chats')
  if (error) throw new Error(friendly(error))
  return (data ?? []) as ChatSummary[]
}

/** Everything you and this person have written to each other, oldest first */
export async function getMessages(me: string, other: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_id, recipient_id, body, created_at, read_at')
    .or(`and(sender_id.eq.${me},recipient_id.eq.${other}),and(sender_id.eq.${other},recipient_id.eq.${me})`)
    .order('created_at', { ascending: true })
    .limit(500)
  if (error) throw new Error(friendly(error))
  return (data ?? []) as Message[]
}

export async function sendMessage(me: string, other: string, body: string): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ sender_id: me, recipient_id: other, body: body.trim() })
    .select('id, sender_id, recipient_id, body, created_at, read_at')
    .single()
  if (error) {
    console.error('Sending a message failed', error)
    throw new Error(friendly(error))
  }
  return data as Message
}

/** Opening a chat marks their messages as read */
export async function markChatRead(other: string): Promise<void> {
  const { error } = await supabase.rpc('mark_chat_read', { other })
  if (error) console.warn('Marking a chat as read failed', error)
}

/** Calls `onMessage` whenever someone sends you a message, straight away. Returns a function to stop. */
export function onNewMessage(me: string, onMessage: (m: Message) => void): () => void {
  const channel = supabase
    .channel(`messages-to-${me}-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${me}` }, (payload) =>
      onMessage(payload.new as Message),
    )
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}

// ---- Words for people ----------------------------------------------------------------------

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()

/** Chats list: "14:32" today, "Yesterday", "Mon" this week, then "12 Oct" */
export function chatTime(iso: string, now = new Date()): string {
  const d = new Date(iso)
  if (sameDay(d, now)) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (sameDay(d, yesterday)) return 'Yesterday'
  const days = (now.getTime() - d.getTime()) / 86400000
  if (days < 7) return d.toLocaleDateString('en-GB', { weekday: 'short' })
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/** Day line inside a chat: "Today", "Yesterday", "Monday 26 October" */
export function chatDay(iso: string, now = new Date()): string {
  const d = new Date(iso)
  if (sameDay(d, now)) return 'Today'
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (sameDay(d, yesterday)) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

/** Time under a message: "14:32" */
export const messageTime = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
