import type { ReactNode } from 'react'
import { Logo } from '../components/brand/Logo'
import { TextLink } from '../components/basics/TextLink'
import welcomeCatDog from '../assets/welcome-cat-dog.webp'

/**
 * The frame shared by Sign up and Log in (Figma 85:10546):
 * logo, a big title, one line underneath, the form, and the cat and dog at the bottom.
 */
export function WelcomeLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="relative isolate mx-auto flex min-h-dvh w-full max-w-[480px] flex-col overflow-hidden bg-surface">
      {/* Background: the cat and dog pinned to the bottom of the screen, behind the content.
          120% of the screen width, centred, with the bottom slightly cropped like in Figma. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 aspect-[393/305] bg-no-repeat bg-[length:120%_auto] bg-[position:center_top]"
        style={{ backgroundImage: `url(${welcomeCatDog})` }}
      />

      <div className="flex flex-col items-center gap-xl px-l pt-[min(104px,12dvh)] pb-[min(56vw,270px)]">
        <Logo animated />
        <div className="flex flex-col items-center gap-xl text-center">
          <h1 className="text-[28px] leading-[1.2] font-medium text-dark-sage">{title}</h1>
          <p className="text-body text-medium-grey">{subtitle}</p>
        </div>
        {children}
      </div>
    </main>
  )
}

/** "Already have an account? Log in" — a line of text ending in a TextLink. */
export function SwitchLink({ question, action, onClick }: { question: string; action: string; onClick?: () => void }) {
  return (
    <p className="text-label text-medium-grey">
      {question} <TextLink onClick={onClick}>{action}</TextLink>
    </p>
  )
}

/** The red message shown above the button when the server says no. */
export function FormError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="w-full text-label text-error">
      {children}
    </p>
  )
}
