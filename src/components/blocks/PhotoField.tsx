import { useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, X } from 'lucide-react'
import { IconButton } from '../basics/Button'
import { Icon } from '../basics/Icon'

/**
 * PhotoField — a big photo for a post: same shape as the photo in a PostCard (12px corners, 361:240).
 * Empty: Light grey box with a faint picture icon and "Add a photo". With a photo: the photo,
 * a camera Icon button bottom-right to change it (as in the PhotoPicker) and an × top-right to remove it.
 */
export interface PhotoFieldProps {
  file: File | null
  onChange: (file: File | null) => void
  label?: string
}

export function PhotoField({ file, onChange, label = 'Photo' }: PhotoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  useEffect(() => {
    if (!file) return setPreview(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  const open = () => inputRef.current?.click()

  return (
    <div className="relative">
      {preview ? (
        <img src={preview} alt="" onClick={open} className="aspect-[361/240] w-full cursor-pointer rounded-card object-cover" />
      ) : (
        <button
          type="button"
          onClick={open}
          className="flex aspect-[361/240] w-full cursor-pointer flex-col items-center justify-center gap-s rounded-card bg-light-grey text-medium-grey outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-sage"
        >
          <Icon icon={ImagePlus} size="large" />
          <span className="text-label">Add a photo</span>
        </button>
      )}
      {preview && (
        <>
          <IconButton icon={X} size="small" variant="neutral" label={`Remove ${label.toLowerCase()}`} onClick={() => onChange(null)} className="absolute! top-s right-s" />
          <IconButton icon={Camera} size="xsmall" variant="primary" label={`Change ${label.toLowerCase()}`} onClick={open} className="absolute! right-s bottom-s ring-2 ring-surface" />
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const chosen = e.target.files?.[0]
          if (chosen) onChange(chosen)
          e.target.value = ''
        }}
      />
    </div>
  )
}
