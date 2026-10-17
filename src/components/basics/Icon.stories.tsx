import { useMemo, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { icons as allIcons } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Icon } from './Icon'

const meta: Meta<typeof Icon> = {
  title: 'Foundations/Icons',
  component: Icon,
  parameters: { layout: 'padded', options: { showPanel: false } },
}
export default meta
type Story = StoryObj<typeof Icon>

// Icons that appear in the Homami Figma file, grouped by where they're used.
const homamiSet: { group: string; names: string[] }[] = [
  { group: 'Navigation', names: ['House', 'Users', 'Handshake', 'MessageCircle', 'Search', 'Bell', 'Menu', 'ArrowLeft', 'ChevronRight', 'ChevronDown', 'X'] },
  { group: 'Pets', names: ['PawPrint', 'Dog', 'Cat', 'Footprints', 'Bone', 'Heart'] },
  { group: 'Details', names: ['CalendarDays', 'MapPin', 'Building2', 'CircleDollarSign', 'Sun', 'Moon', 'CloudMoon', 'Clock'] },
  { group: 'Actions', names: ['Plus', 'Camera', 'Upload', 'Share2', 'PencilLine', 'Copy', 'Check', 'Settings'] },
  { group: 'Trust', names: ['ShieldCheck', 'BadgeCheck', 'Star', 'ThumbsUp', 'Zap'] },
]

function lookup(name: string): LucideIcon | undefined {
  return (allIcons as Record<string, LucideIcon>)[name]
}

function Tile({ name, glyph }: { name: string; glyph: LucideIcon }) {
  return (
    <div className="flex w-[104px] flex-col items-center gap-s rounded-small p-s text-dark-grey hover:bg-light-grey">
      <Icon icon={glyph} />
      <span className="text-caption text-medium-grey text-center break-all">{name}</span>
    </div>
  )
}

/** The icons used in Homami today. Use these first so the app stays consistent. */
export const HomamiSet: Story = {
  name: 'Homami set',
  render: () => (
    <div className="flex flex-col gap-xl">
      <p className="text-body text-medium-grey max-w-[560px]">
        All icons come from Lucide, always with a 1.5 stroke. Need one that isn't here? Search the full library on the next page.
      </p>
      {homamiSet.map(({ group, names }) => (
        <section key={group}>
          <h2 className="text-overline text-medium-grey mb-s">{group}</h2>
          <div className="flex flex-wrap gap-xs">
            {names.map((n) => {
              const g = lookup(n)
              return g ? <Tile key={n} name={n} glyph={g} /> : null
            })}
          </div>
        </section>
      ))}
    </div>
  ),
}

/** The four sizes. Icons take the colour of the text around them. */
export const Sizes: Story = {
  render: () => {
    const Dog = lookup('Dog')!
    return (
      <div className="flex flex-col gap-xl">
        <div className="flex items-end gap-xl">
          {(['xsmall', 'small', 'medium', 'large'] as const).map((s) => (
            <div key={s} className="flex flex-col items-center gap-s">
              <Icon icon={Dog} size={s} />
              <span className="text-label-bold capitalize">{s}</span>
              <span className="text-caption text-medium-grey">{{ xsmall: 16, small: 20, medium: 24, large: 28 }[s]}px</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-l">
          <span className="text-primary-sage"><Icon icon={Dog} /></span>
          <span className="text-dark-sage"><Icon icon={Dog} /></span>
          <span className="text-medium-grey"><Icon icon={Dog} /></span>
          <span className="text-error"><Icon icon={Dog} /></span>
          <span className="text-caption text-medium-grey">Same icon in different text colours</span>
        </div>
      </div>
    )
  },
}

function AllIconsBrowser() {
  const [query, setQuery] = useState('')
  const entries = useMemo(() => Object.entries(allIcons as Record<string, LucideIcon>), [])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? entries.filter(([n]) => n.toLowerCase().includes(q)) : entries
  }, [entries, query])
  return (
    <div className="flex flex-col gap-l">
      <div className="flex flex-wrap items-center gap-m">
        <input
          id="icon-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search icons, e.g. dog, calendar, heart"
          className="h-[44px] w-[320px] max-w-full rounded-input border border-medium-grey px-l text-label text-dark-grey outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-sage"
        />
        <span className="text-caption text-medium-grey">{filtered.length} of {entries.length} icons</span>
      </div>
      <div className="flex flex-wrap gap-xs">
        {filtered.slice(0, 600).map(([n, g]) => (
          <Tile key={n} name={n} glyph={g} />
        ))}
      </div>
      {filtered.length > 600 && (
        <p className="text-caption text-medium-grey">Showing the first 600. Type to narrow it down.</p>
      )}
    </div>
  )
}

/** Every Lucide icon, searchable by name. */
export const AllIcons: Story = {
  name: 'All Lucide icons',
  render: () => <AllIconsBrowser />,
}
