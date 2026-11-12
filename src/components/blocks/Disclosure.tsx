import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

/**
 * Disclosure — a question you tap to open its answer, on Find out more (Sara, Nov 12; not in Figma yet).
 * Body Bold question with a chevron that turns when open; the answer in Label, Medium grey.
 * A Soft grey line between questions. Uses the browser's own <details>, so it works with keyboards
 * and screen readers, and Find (Cmd+F) opens it.
 */
export interface DisclosureProps {
  question: string
  children: ReactNode
  defaultOpen?: boolean
}

export function Disclosure({ question, children, defaultOpen }: DisclosureProps) {
  return (
    <details open={defaultOpen} className="group border-b border-light-grey last:border-b-0">
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-s py-s text-body-bold text-dark-grey outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-primary-sage [&::-webkit-details-marker]:hidden">
        <span className="flex-1">{question}</span>
        <ChevronDown size={20} strokeWidth={1} absoluteStrokeWidth aria-hidden className="shrink-0 transition-transform duration-150 group-open:rotate-180" />
      </summary>
      <div className="flex flex-col gap-s pb-m text-label text-medium-grey">{children}</div>
    </details>
  )
}
