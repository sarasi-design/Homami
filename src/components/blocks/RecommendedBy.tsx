import { AvatarGroup } from '../basics/Avatar'

/**
 * RecommendedBy — "Recommended by Anna and 12 more", with the faces of the people you know
 * (Sara, Nov 13, 2026; the "endorse" idea on Figma USER PROFILE 113:13452). On sitter cards and profiles.
 * Faces only for people in your circle or extended circle (from the database); the rest is a number.
 * The label comes from recommendedByLabel() in src/lib/reviews.ts.
 */
export interface RecommendedByProps {
  label: string
  people: { name: string; photoUrl?: string | null }[]
}

export function RecommendedBy({ label, people }: RecommendedByProps) {
  return (
    <span className="flex min-h-[28px] items-center gap-s">
      {people.length > 0 && <AvatarGroup size="small" max={3} people={people.map((p) => ({ name: p.name, src: p.photoUrl ?? undefined }))} aria-hidden />}
      <span className="text-label-bold text-dark-sage">{label}</span>
    </span>
  )
}
