import { useLayoutEffect, useRef, useState } from 'react'
import { SendHorizontal } from 'lucide-react'
import { IconButton } from '../basics/Button'

/**
 * MessageComposer — the bar at the bottom of a chat: a rounded text field (Soft grey border, grows up
 * to 5 lines) and a round Dark sage send button, disabled while the field is empty.
 * Enter sends; Shift+Enter starts a new line. White, with a Soft grey line on top.
 */
export interface MessageComposerProps {
  onSend: (text: string) => void
  /** e.g. "Message Cleo" */
  placeholder?: string
  disabled?: boolean
  autoFocus?: boolean
}

const MAX = 2000

export function MessageComposer({ onSend, placeholder = 'Write a message', disabled, autoFocus }: MessageComposerProps) {
  const [text, setText] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)
  const empty = text.trim() === ''

  // Grow with the text, up to about 5 lines
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`
  }, [text])

  const send = () => {
    if (empty || disabled) return
    onSend(text.trim())
    setText('')
    ref.current?.focus()
  }

  return (
    <form
      className="flex items-end gap-s border-t border-soft-grey bg-surface px-l pt-s pb-[max(8px,env(safe-area-inset-bottom))]"
      onSubmit={(e) => {
        e.preventDefault()
        send()
      }}
    >
      <label htmlFor="message-text" className="sr-only">
        {placeholder}
      </label>
      <textarea
        id="message-text"
        ref={ref}
        rows={1}
        value={text}
        maxLength={MAX}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault()
            send()
          }
        }}
        className="min-h-[44px] flex-1 resize-none rounded-[22px] border border-soft-grey bg-surface px-l py-[10px] text-[16px] leading-[22px] text-dark-grey placeholder:text-medium-grey outline-none focus:border-dark-grey"
      />
      <IconButton type="submit" icon={SendHorizontal} label="Send" variant="dark" disabled={empty || disabled} />
    </form>
  )
}
