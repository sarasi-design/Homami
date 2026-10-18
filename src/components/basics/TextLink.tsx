import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

/**
 * TextLink — a tappable word inside a sentence, e.g. "Already have an account? **Log in**".
 * Label Bold, Dark grey, underlined, with a 44px tall tap area so it's easy to hit on a phone.
 * Use Button for actions that stand on their own; use TextLink only inside a line of text.
 */
export interface TextLinkProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

export function TextLink({ className, children, type = 'button', ...rest }: TextLinkProps) {
  return (
    <button
      type={type}
      className={clsx(
        'inline-flex min-h-[44px] cursor-pointer items-center text-label-bold text-dark-grey underline underline-offset-4',
        'rounded-small outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-primary-sage',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
