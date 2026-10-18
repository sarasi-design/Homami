import type { ReactNode } from 'react'

/**
 * Steps — Figma "How it works" card on Invite friends: a Title, then numbered lines.
 * Each number sits in a Pale bubble pill (Figma "bullet" 250:128699); text in Label Light.
 */
export function Steps({ title, steps }: { title: string; steps: ReactNode[] }) {
  return (
    <section className="flex flex-col gap-[20px] rounded-card border border-light-grey p-l">
      <h2 className="text-title text-dark-grey">{title}</h2>
      <ol className="flex flex-col gap-[20px]">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-s">
            <span aria-hidden className="flex h-[30px] min-w-[24px] shrink-0 items-center justify-center rounded-pill bg-pale-bubble px-s text-body-bold text-dark-grey">
              {i + 1}
            </span>
            <span className="pt-xs text-label-light text-dark-grey">{step}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
