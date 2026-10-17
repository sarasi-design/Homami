import { useId, useState } from 'react'
import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'

/**
 * TextInput — Figma "InputText" (72:7839)
 *
 * 44px tall, 4px corners, Medium grey border. Typed text is 16px (not 14px as in Figma)
 * because iPhones zoom the whole page in when you tap a field with smaller text.
 *
 * States: rest · focus (Primary sage 2px border) · error (Error border + message) · disabled.
 * Every field has a label for screen readers; `hideLabel` keeps it invisible if the design
 * relies on the placeholder only.
 */
interface FieldChromeProps {
  id: string
  label: string
  hideLabel?: boolean
  helper?: ReactNode
  error?: ReactNode
  count?: { value: number; max: number }
  children: ReactNode
}

function FieldChrome({ id, label, hideLabel, helper, error, count, children }: FieldChromeProps) {
  const message = error ?? helper
  return (
    <div className="flex w-full flex-col gap-s">
      <label htmlFor={id} className={clsx('text-label-bold text-dark-grey', hideLabel && 'sr-only')}>
        {label}
      </label>
      {children}
      {(message || count) && (
        <div className="flex items-start gap-s">
          {message && (
            <p id={`${id}-message`} className={clsx('flex-1 text-caption', error ? 'text-error' : 'text-medium-grey')}>
              {message}
            </p>
          )}
          {count && (
            <p className="ml-auto text-caption text-dark-grey tabular-nums" aria-live="polite">
              {count.value}/{count.max} characters
            </p>
          )}
        </div>
      )}
    </div>
  )
}

const boxBase =
  'w-full rounded-input border bg-surface text-[16px] leading-[22px] font-medium text-dark-grey placeholder:text-medium-grey ' +
  'transition-colors duration-150 outline-none ' +
  'focus:border-primary-sage focus:shadow-[inset_0_0_0_1px_var(--color-primary-sage)] ' +
  'disabled:bg-light-grey disabled:text-medium-grey disabled:cursor-not-allowed'

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string
  hideLabel?: boolean
  helper?: ReactNode
  /** Shows the field in red with this message underneath */
  error?: ReactNode
  /** Icon inside the field on the right, e.g. a location pin */
  icon?: LucideIcon
  /** Shows "12/100 characters" under the field */
  showCount?: boolean
}

export function TextInput({
  label,
  hideLabel,
  helper,
  error,
  icon: Icon,
  showCount,
  maxLength,
  id,
  value,
  defaultValue,
  onChange,
  className,
  ...rest
}: TextInputProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const [length, setLength] = useState(String(value ?? defaultValue ?? '').length)
  return (
    <FieldChrome
      id={fieldId}
      label={label}
      hideLabel={hideLabel}
      helper={helper}
      error={error}
      count={showCount && maxLength ? { value: value !== undefined ? String(value).length : length, max: maxLength } : undefined}
    >
      <div className="relative">
        <input
          id={fieldId}
          value={value}
          defaultValue={defaultValue}
          maxLength={maxLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || helper ? `${fieldId}-message` : undefined}
          onChange={(e) => {
            setLength(e.target.value.length)
            onChange?.(e)
          }}
          className={clsx(
            boxBase,
            'h-[44px] px-l',
            Icon && 'pr-[48px]',
            error ? 'border-error focus:border-error focus:shadow-[inset_0_0_0_1px_var(--color-error)]' : 'border-medium-grey',
            className,
          )}
          {...rest}
        />
        {Icon && (
          <Icon
            size={24}
            strokeWidth={1.5}
            aria-hidden
            className="pointer-events-none absolute right-m top-1/2 -translate-y-1/2 text-dark-grey"
          />
        )}
      </div>
    </FieldChrome>
  )
}

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  hideLabel?: boolean
  helper?: ReactNode
  error?: ReactNode
  showCount?: boolean
}

/** Multi-line version, e.g. a short bio or a pet's description. Starts 3 lines tall. */
export function TextArea({
  label,
  hideLabel,
  helper,
  error,
  showCount,
  maxLength,
  id,
  value,
  defaultValue,
  onChange,
  rows = 3,
  className,
  ...rest
}: TextAreaProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const [length, setLength] = useState(String(value ?? defaultValue ?? '').length)
  return (
    <FieldChrome
      id={fieldId}
      label={label}
      hideLabel={hideLabel}
      helper={helper}
      error={error}
      count={showCount && maxLength ? { value: value !== undefined ? String(value).length : length, max: maxLength } : undefined}
    >
      <textarea
        id={fieldId}
        rows={rows}
        value={value}
        defaultValue={defaultValue}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || helper ? `${fieldId}-message` : undefined}
        onChange={(e) => {
          setLength(e.target.value.length)
          onChange?.(e)
        }}
        className={clsx(
          boxBase,
          'min-h-[105px] resize-y px-l py-m',
          error ? 'border-error focus:border-error focus:shadow-[inset_0_0_0_1px_var(--color-error)]' : 'border-medium-grey',
          className,
        )}
        {...rest}
      />
    </FieldChrome>
  )
}
