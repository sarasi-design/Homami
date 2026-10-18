import { useState } from 'react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Euro } from 'lucide-react'
import { Button } from '../basics/Button'
import { TextInput } from '../basics/TextInput'
import { Toggle } from '../basics/Toggle'

/**
 * ServiceCard — Figma "Service & prices" cards (91:10326): 12px corners, Soft grey border, 16px padding.
 * Icon + title (Body Bold) + a short description (Caption, Medium grey); on the right a control.
 *
 *   PriceServiceCard   "Set price" → a € field and "Save price" → "25 € / day" with "Edit".
 *                      Clearing the field and saving removes the price.
 *   ToggleServiceCard  an on/off switch, for the free exchange options.
 */
export interface ServiceCardProps {
  icon: LucideIcon
  title: string
  description: string
  right?: ReactNode
  children?: ReactNode
  /** id of the title, so the control can point to it */
  titleId?: string
}

export function ServiceCard({ icon: Icon, title, description, right, children, titleId }: ServiceCardProps) {
  return (
    <div className="flex flex-col gap-m rounded-card border border-soft-grey p-l">
      <div className="flex items-start gap-m">
        <Icon size={24} strokeWidth={1} absoluteStrokeWidth aria-hidden className="mt-[2px] shrink-0 text-dark-grey" />
        <div className="flex flex-1 flex-col gap-xs">
          <p id={titleId} className="text-body-bold text-dark-grey">
            {title}
          </p>
          <p className="text-caption text-medium-grey">{description}</p>
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      {children}
    </div>
  )
}

export interface PriceServiceCardProps extends Omit<ServiceCardProps, 'right' | 'children'> {
  /** Euros, or null when there's no price yet */
  price: number | null
  onChange: (price: number | null) => void
  /** e.g. "day", "night", "hour" */
  unit: string
}

export function PriceServiceCard({ price, onChange, unit, title, ...card }: PriceServiceCardProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(price === null ? '' : String(price))
  const parsed = draft.trim() === '' ? null : Number(draft.replace(',', '.'))
  const invalid = parsed !== null && (!Number.isFinite(parsed) || parsed < 0 || parsed > 9999)

  const startEditing = () => {
    setDraft(price === null ? '' : String(price))
    setEditing(true)
  }

  const save = () => {
    if (invalid) return
    onChange(parsed === null ? null : Math.round(parsed * 100) / 100)
    setEditing(false)
  }

  if (editing) {
    return (
      <ServiceCard
        {...card}
        title={title}
        right={
          <Button variant="outline" size="small" onClick={save} disabled={invalid}>
            Save price
          </Button>
        }
      >
        <TextInput
          label={`${title} price in euros per ${unit}`}
          hideLabel
          placeholder={`Add your price per ${unit}`}
          inputMode="decimal"
          icon={Euro}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              save()
            }
          }}
          error={invalid ? 'Use a number, e.g. 25' : undefined}
          helper="Leave empty and save to remove the price"
          autoFocus
        />
      </ServiceCard>
    )
  }

  return (
    <ServiceCard
      {...card}
      title={title}
      right={
        price === null ? (
          <Button variant="outline" size="small" onClick={startEditing} aria-label={`Set price for ${title}`}>
            Set price
          </Button>
        ) : (
          <span className="flex items-center gap-s">
            <span className="text-body-bold text-dark-grey">
              {`${Number.isInteger(price) ? price : price.toFixed(2)} €`}
              <span className="text-label text-medium-grey"> / {unit}</span>
            </span>
            <Button variant="ghost" size="xsmall" onClick={startEditing} aria-label={`Edit price for ${title}`}>
              Edit
            </Button>
          </span>
        )
      }
    />
  )
}

export interface ToggleServiceCardProps extends Omit<ServiceCardProps, 'right' | 'children' | 'titleId'> {
  checked: boolean
  onChange: (checked: boolean) => void
  id: string
}

export function ToggleServiceCard({ checked, onChange, id, ...card }: ToggleServiceCardProps) {
  return (
    <ServiceCard
      {...card}
      titleId={`${id}-title`}
      right={<Toggle checked={checked} onChange={onChange} aria-labelledby={`${id}-title`} />}
    />
  )
}
