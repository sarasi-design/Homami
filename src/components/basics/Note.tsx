import type { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

/**
 * Note — the pale blue info box from Figma (e.g. "Add a picture of your pet",
 * "Only priced services will be displayed in your profile").
 * 8px corners, 8px padding, Pale bubble background. Optional bold first line.
 */
export interface NoteProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode
  children?: ReactNode
}

export function Note({ title, children, className, ...rest }: NoteProps) {
  return (
    <div className={clsx('flex flex-col gap-xs rounded-small bg-pale-bubble p-s', className)} {...rest}>
      {title && <p className="text-label-bold text-dark-grey">{title}</p>}
      {children && <div className="text-label text-medium-grey">{children}</div>}
    </div>
  )
}
