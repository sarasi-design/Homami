import { useEffect, useId, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowUpToLine, Camera } from 'lucide-react'
import clsx from 'clsx'

/**
 * PhotoPicker — Figma "Photo" row in "Let's set up your profile" (85:10585):
 * an 80px round button on the left and a pale blue note on the right.
 *
 * Tap the circle to choose a photo from the phone (or take one). Once chosen it shows
 * in the circle with a small camera badge, and tapping again swaps it.
 * Used for people now and for pets next.
 */
export interface PhotoPickerProps {
  /** The photo chosen in this visit, if any */
  file?: File | null
  /** A photo already saved before, shown until a new one is chosen */
  currentUrl?: string | null
  onChange: (file: File) => void
  /** Bold line in the note, e.g. "Add a profile picture" */
  title: string
  /** Second line in the note */
  hint?: ReactNode
  /** Read out by screen readers, e.g. "Profile picture" */
  label: string
  error?: string
  /** What the empty circle shows: an upload arrow (people) or a green camera button (pets) */
  emptyStyle?: 'upload' | 'camera'
}

export function PhotoPicker({ file, currentUrl, onChange, title, hint, label, error, emptyStyle = 'upload' }: PhotoPickerProps) {
  const id = useId()
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!file) return setPreview(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const shown = preview ?? currentUrl ?? null

  return (
    <div className="flex w-full flex-col gap-s">
      <div className="flex w-full items-center gap-m">
        <label
          htmlFor={id}
          className={clsx(
            'relative flex size-[80px] shrink-0 cursor-pointer items-center justify-center rounded-pill bg-light-grey text-dark-grey',
            'transition-transform duration-150 active:scale-[0.97]',
            'focus-within:outline-solid focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary-sage',
            error && 'ring-2 ring-error',
          )}
        >
          <input
            id={id}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label={shown ? `${label}: change photo` : `${label}: add photo`}
            aria-describedby={error ? `${id}-error` : undefined}
            onChange={(e) => {
              const chosen = e.target.files?.[0]
              if (chosen) onChange(chosen)
              e.target.value = '' // lets you pick the same photo again
            }}
          />
          {shown ? (
            <>
              <img src={shown} alt="" className="size-full rounded-pill object-cover" />
              <span className="absolute -right-xs -bottom-xs flex size-[30px] items-center justify-center rounded-pill bg-dark-grey text-surface ring-2 ring-surface">
                <Camera size={16} strokeWidth={1} absoluteStrokeWidth aria-hidden />
              </span>
            </>
          ) : emptyStyle === 'camera' ? (
            <span className="flex size-[30px] items-center justify-center rounded-pill bg-primary-sage text-surface">
              <Camera size={16} strokeWidth={1} absoluteStrokeWidth aria-hidden />
            </span>
          ) : (
            <ArrowUpToLine size={24} strokeWidth={1} absoluteStrokeWidth aria-hidden />
          )}
        </label>

        <div className="flex flex-1 flex-col gap-xs rounded-small bg-pale-bubble p-s">
          <p className="text-label-bold text-dark-grey">{title}</p>
          {hint && <p className="text-label text-medium-grey">{hint}</p>}
        </div>
      </div>
      {error && (
        <p id={`${id}-error`} className="text-caption text-error">
          {error}
        </p>
      )}
    </div>
  )
}
