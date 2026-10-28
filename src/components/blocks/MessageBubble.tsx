import clsx from 'clsx'

/**
 * MessageBubble — one message in a chat.
 *   Yours: on the right, Dark sage with white text.
 *   Theirs: on the left, Light grey with Dark grey text.
 * 12px corners, with a smaller 4px corner on the side it came from. Up to 80% of the width.
 * The time sits underneath in Caption. While it's sending it's slightly faded; if it fails,
 * "Not sent" and a "Try again" link show underneath.
 */
export interface MessageBubbleProps {
  body: string
  mine?: boolean
  /** e.g. "14:32" */
  time?: string
  status?: 'sending' | 'sent' | 'failed'
  onRetry?: () => void
  /** Hide the time when the next message is from the same person a moment later */
  showTime?: boolean
}

export function MessageBubble({ body, mine = false, time, status = 'sent', onRetry, showTime = true }: MessageBubbleProps) {
  return (
    <div className={clsx('flex flex-col gap-xs', mine ? 'items-end' : 'items-start')}>
      <p
        className={clsx(
          'max-w-[80%] whitespace-pre-wrap break-words rounded-card px-m py-s text-body',
          mine ? 'rounded-br-[4px] bg-dark-sage text-surface' : 'rounded-bl-[4px] bg-light-grey text-dark-grey',
          status === 'sending' && 'opacity-60',
        )}
      >
        {body}
      </p>
      {status === 'failed' ? (
        <p role="alert" className="text-caption text-error">
          Not sent ·{' '}
          <button type="button" onClick={onRetry} className="cursor-pointer font-semibold underline underline-offset-2">
            Try again
          </button>
        </p>
      ) : (
        showTime &&
        time && <p className="text-caption text-medium-grey">{status === 'sending' ? 'Sending…' : time}</p>
      )}
    </div>
  )
}

/** ChatDay — the "Today" / "Yesterday" / "Monday 26 October" line between days in a chat */
export function ChatDay({ label }: { label: string }) {
  return (
    <p className="py-s text-center text-caption text-medium-grey" role="separator" aria-label={label}>
      {label}
    </p>
  )
}
