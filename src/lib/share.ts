import { useState } from 'react'

/** Copies text, and says "Copied" for 2 seconds. If copying isn't allowed, selects the field instead. */
export function useCopy(fallbackFieldId?: string) {
  const [copied, setCopied] = useState<string | null>(null)
  async function copy(text: string, which = text) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(which)
      window.setTimeout(() => setCopied((c) => (c === which ? null : c)), 2000)
    } catch {
      const field = fallbackFieldId ? (document.getElementById(fallbackFieldId) as HTMLInputElement | null) : null
      field?.select()
    }
  }
  return { copied, copy }
}

/** Opens the phone's share sheet; where there isn't one, copies the text instead. */
export async function shareInvite(text: string, url: string, copy: (t: string) => void) {
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Homami', text, url })
    } catch {
      // closing the share sheet is fine
    }
  } else {
    copy(`${text} ${url}`)
  }
}
