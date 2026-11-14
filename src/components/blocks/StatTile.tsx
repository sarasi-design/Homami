import clsx from 'clsx'

/**
 * StatTile — one number with what it counts, for the Homami team page (Sara, Nov 14, 2026; not in Figma yet).
 * Light grey box with 12px corners: the number in Title, the label in Label grey, an optional detail in Caption.
 */
export interface StatTileProps {
  value: number | string
  label: string
  /** e.g. "+3 this week" */
  detail?: string
  className?: string
}

export function StatTile({ value, label, detail, className }: StatTileProps) {
  return (
    <div className={clsx('flex flex-col gap-xs rounded-card bg-light-grey p-m', className)}>
      <p className="text-title text-dark-grey tabular-nums">{value}</p>
      <p className="text-label text-medium-grey">{label}</p>
      {detail && <p className="text-caption text-medium-grey">{detail}</p>}
    </div>
  )
}
