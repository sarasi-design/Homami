import type { ReactNode } from 'react'
import { Logo } from '../components/brand/Logo'
import welcomeCatDog from '../assets/welcome-cat-dog.webp'

/**
 * The frame shared by Sign up and Log in (Figma 85:10546):
 * logo, a big title, one line underneath, the form, and the cat and dog at the bottom.
 */
export function WelcomeLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col overflow-x-clip bg-surface">
      <div className="flex flex-col items-center gap-xl px-l pt-[min(104px,12dvh)] pb-m">
        <Logo />
        <div className="flex flex-col items-center gap-xl text-center">
          <h1 className="text-[28px] leading-[1.2] font-medium text-dark-sage">{title}</h1>
          <p className="text-body text-medium-grey">{subtitle}</p>
        </div>
        {children}
      </div>

      {/* Cat and dog: 120% of the screen width, sitting on the bottom edge and cropped like in Figma */}
      <div aria-hidden className="relative mt-auto aspect-[393/305] w-full shrink-0 overflow-hidden">
        <img
          src={welcomeCatDog}
          alt=""
          width={944}
          height={737}
          className="absolute top-0 left-[-9.16%] w-[120.1%] max-w-none select-none"
          draggable={false}
        />
      </div>
    </main>
  )
}

/** "Already have an account? Log in" — a line of text with a tappable word at the end. */
export function SwitchLink({ question, action, onClick }: { question: string; action: string; onClick?: () => void }) {
  return (
    <p className="text-label text-medium-grey">
      {question}{' '}
      <button
        type="button"
        onClick={onClick}
        className={
          'inline-flex min-h-[44px] cursor-pointer items-center text-label-bold text-dark-grey underline underline-offset-4 ' +
          'rounded-small outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-primary-sage'
        }
      >
        {action}
      </button>
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
