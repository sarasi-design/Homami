import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Camera, PawPrint, UserRound } from 'lucide-react'
import { Avatar } from '../basics/Avatar'
import { IconButton } from '../basics/Button'
import { Icon } from '../basics/Icon'
import { Note } from '../basics/Note'

/**
 * PhotoPicker — Figma "Photo" row (85:10585 / 91:8642): an 80px photo circle and a Note.
 * Built only from design-system parts:
 *   Avatar (large, 80px) once a photo is chosen · Icon (large) faint outline while empty
 *   Icon button (Xsmall, Default/sage, camera) always on the bottom-right of the circle (Oct 2026)
 *   Note for the title and hint
 * Tapping the circle or the camera opens the phone's photo picker.
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
  /** Whose photo: sets the faint outline shown in the empty circle */
  subject?: 'person' | 'pet'
  error?: string
}

export function PhotoPicker({ file, currentUrl, onChange, title, hint, label, subject = 'person', error }: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!file) return setPreview(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const shown = preview ?? currentUrl ?? null
  const open = () => inputRef.current?.click()

  return (
    <div className="flex w-full flex-col gap-s">
      <div className="flex w-full items-center gap-m">
        <div className="relative shrink-0">
          {/* The circle is a big, easy tap target; the camera button is the one screen readers and keyboards use */}
          <div aria-hidden onClick={open} className="cursor-pointer transition-transform duration-150 active:scale-[0.97]">
            {shown ? (
              <Avatar size="large" name={label} src={shown} />
            ) : (
              <span className="flex size-[80px] items-center justify-center rounded-pill bg-light-grey text-soft-grey">
                <Icon icon={subject === 'pet' ? PawPrint : UserRound} size="large" />
              </span>
            )}
          </div>
          <IconButton
            icon={Camera}
            size="xsmall"
            variant="primary"
            label={shown ? `${label}: change photo` : `${label}: add photo`}
            onClick={open}
            aria-describedby={error ? `${label}-photo-error` : undefined}
            className="absolute -right-xs -bottom-xs ring-2 ring-surface"
          />
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const chosen = e.target.files?.[0]
              if (chosen) onChange(chosen)
              e.target.value = '' // lets you pick the same photo again
            }}
          />
        </div>

        <Note title={title} className="flex-1">
          {hint}
        </Note>
      </div>
      {error && (
        <p id={`${label}-photo-error`} className="text-caption text-error">
          {error}
        </p>
      )}
    </div>
  )
}
