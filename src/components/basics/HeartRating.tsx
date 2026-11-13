import { useId } from 'react'
import { Heart } from 'lucide-react'
import clsx from 'clsx'

/**
 * HeartRating — 1 to 5 hearts, Homami's stars (Figma "Reviews" on a sitter's profile, 134:17152,
 * and "review--card" 53:4182: ♥♥♥♥♡).
 * Filled hearts in Dark sage, empty ones in Soft sage. A half heart for averages like 4.5.
 *   Showing a rating: <HeartRating value={4.5} />  (sizes: small 14px in cards, large 28px in the summary)
 *   Picking one:      <HeartRating value={rating} onChange={setRating} label="How was it?" />
 *     5 radio buttons with a 44px tap area each; arrow keys work too.
 */
export interface HeartRatingProps {
  /** 0–5; halves show a half heart */
  value: number
  /** Makes it a picker */
  onChange?: (value: number) => void
  /** Read out by screen readers when it's a picker */
  label?: string
  size?: 'small' | 'medium' | 'large'
  className?: string
}

const pixels = { small: 14, medium: 20, large: 28 }
const words = ['', 'Not good', 'Could be better', 'Good', 'Very good', 'Wonderful']

function OneHeart({ fill, px }: { fill: 0 | 0.5 | 1; px: number }) {
  return (
    <span className="relative inline-flex shrink-0" style={{ width: px, height: px }}>
      <Heart size={px} strokeWidth={0} className="absolute inset-0 fill-soft-sage" aria-hidden />
      {fill > 0 && (
        <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: fill === 1 ? px : px / 2 }}>
          <Heart size={px} strokeWidth={0} className="fill-dark-sage" aria-hidden />
        </span>
      )}
    </span>
  )
}

const fillFor = (value: number, i: number): 0 | 0.5 | 1 => {
  const rounded = Math.round(value * 2) / 2
  return rounded >= i ? 1 : rounded >= i - 0.5 ? 0.5 : 0
}

export function HeartRating({ value, onChange, label, size = 'small', className }: HeartRatingProps) {
  const name = useId()
  const px = pixels[onChange ? 'large' : size]

  if (!onChange) {
    return (
      <span role="img" aria-label={`${value} out of 5 hearts`} className={clsx('inline-flex items-center gap-[2px]', className)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <OneHeart key={i} fill={fillFor(value, i)} px={px} />
        ))}
      </span>
    )
  }

  return (
    <div className={clsx('flex flex-col gap-xs', className)}>
      <div role="radiogroup" aria-label={label} className="flex items-center">
        {[1, 2, 3, 4, 5].map((i) => (
          <label
            key={i}
            className="group relative inline-flex size-[44px] cursor-pointer items-center justify-center rounded-pill has-[:focus-visible]:outline-solid has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary-sage"
          >
            <input
              type="radio"
              name={name}
              value={i}
              checked={value === i}
              onChange={() => onChange(i)}
              aria-label={`${i} ${i === 1 ? 'heart' : 'hearts'}: ${words[i]}`}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
            <span className="transition-transform duration-150 group-active:scale-90 motion-reduce:group-active:scale-100">
              <OneHeart fill={value >= i ? 1 : 0} px={px} />
            </span>
          </label>
        ))}
      </div>
      <p aria-live="polite" className="min-h-[20px] pl-s text-label text-medium-grey">
        {value > 0 ? words[value] : ''}
      </p>
    </div>
  )
}
