import type { Meta, StoryObj } from '@storybook/react-vite'

const meta: Meta = {
  title: 'Foundations/Overview',
  parameters: { layout: 'padded', options: { showPanel: false } },
}
export default meta
type Story = StoryObj

const colourGroups: { group: string; items: [string, string][] }[] = [
  {
    group: 'Brand',
    items: [
      ['Primary sage', 'primary-sage'],
      ['Dark sage', 'dark-sage'],
      ['Soft sage', 'soft-sage'],
      ['Light sage', 'light-sage'],
    ],
  },
  {
    group: 'Neutral',
    items: [
      ['Surface', 'surface'],
      ['Light grey', 'light-grey'],
      ['Soft grey', 'soft-grey'],
      ['Medium grey', 'medium-grey'],
      ['Dark grey', 'dark-grey'],
    ],
  },
  {
    group: 'Semantic',
    items: [
      ['Error', 'error'],
      ['Success', 'success'],
      ['Alert', 'alert'],
    ],
  },
  {
    group: 'Pastels',
    items: [
      ['Peach', 'peach'],
      ['Pale peach', 'pale-peach'],
      ['Salmon', 'salmon'],
      ['Pale salmon', 'pale-salmon'],
      ['Gold', 'gold'],
      ['Pale gold', 'pale-gold'],
      ['Glicine', 'glicine'],
      ['Pale glicine', 'pale-glicine'],
      ['Bubble blue', 'bubble-blue'],
      ['Pale bubble', 'pale-bubble'],
      ['Mushroom', 'mushroom'],
    ],
  },
]

function readVar(name: string) {
  if (typeof window === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

export const Colours: Story = {
  render: () => (
    <div className="flex flex-col gap-xl">
      {colourGroups.map(({ group, items }) => (
        <section key={group}>
          <h2 className="text-overline text-medium-grey mb-m">{group}</h2>
          <div className="flex flex-wrap gap-l">
            {items.map(([label, token]) => (
              <div key={token} className="w-[120px]">
                <div
                  className="h-[72px] rounded-small border border-soft-grey"
                  style={{ background: `var(--color-${token})` }}
                />
                <p className="text-label-bold mt-s">{label}</p>
                <p className="text-caption text-medium-grey">{readVar(`--color-${token}`)}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
}

const textStyles: [string, string, string][] = [
  ['Title Large Bold', 'text-title-large-bold', '24 / SemiBold / 1.3'],
  ['Title Large', 'text-title-large', '24 / Medium / 1.3'],
  ['Title', 'text-title', '20 / Regular / 1.3'],
  ['Heading / Name', 'text-heading-name', '16 / SemiBold / 1.3'],
  ['Body', 'text-body', '16 / Medium / 22px'],
  ['Body Bold', 'text-body-bold', '16 / SemiBold / 22px'],
  ['Label', 'text-label', '14 / Medium / 1.3'],
  ['Label Bold', 'text-label-bold', '14 / SemiBold / 1.3'],
  ['Label light', 'text-label-light', '14 / Regular / 20px'],
  ['Caption', 'text-caption', '13 / Regular / 1.3'],
  ['Overline', 'text-overline', '13 / Regular / 1.3 / uppercase'],
]

export const Typography: Story = {
  render: () => (
    <div className="flex flex-col gap-l max-w-[560px]">
      {textStyles.map(([name, cls, spec]) => (
        <div key={name} className="flex items-baseline gap-l border-b border-light-grey pb-m">
          <div className="w-[160px] shrink-0">
            <p className="text-label-bold">{name}</p>
            <p className="text-caption text-medium-grey">{spec}</p>
          </div>
          <p className={cls}>Build your trusted circle</p>
        </div>
      ))}
    </div>
  ),
}

const spacing: [string, string][] = [
  ['xs', '4px'],
  ['s', '8px'],
  ['m', '12px'],
  ['l', '16px'],
  ['xl', '24px'],
  ['2xl', '32px'],
]
const radii: [string, string, string][] = [
  ['input', '4px', 'Text inputs'],
  ['small', '8px', 'Square tags, inner boxes'],
  ['card', '12px', 'Cards'],
  ['pill', 'round', 'Buttons, round tags, avatars'],
]

export const SpacingAndCorners: Story = {
  name: 'Spacing & corners',
  render: () => (
    <div className="flex flex-col gap-2xl">
      <section>
        <h2 className="text-overline text-medium-grey mb-m">Spacing</h2>
        <div className="flex flex-col gap-s">
          {spacing.map(([name, px]) => (
            <div key={name} className="flex items-center gap-l">
              <span className="text-label-bold w-[48px]">{name}</span>
              <span className="block h-[16px] bg-primary-sage" style={{ width: px }} />
              <span className="text-caption text-medium-grey">{px}</span>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-overline text-medium-grey mb-m">Corners</h2>
        <div className="flex flex-wrap gap-xl">
          {radii.map(([name, px, use]) => (
            <div key={name} className="w-[140px]">
              <div
                className="h-[72px] w-[120px] border border-soft-grey bg-light-sage"
                style={{ borderRadius: `var(--radius-${name})` }}
              />
              <p className="text-label-bold mt-s">{name} · {px}</p>
              <p className="text-caption text-medium-grey">{use}</p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-overline text-medium-grey mb-m">Shadow</h2>
        <div className="h-[64px] w-[260px] bg-surface rounded-small shadow-nav flex items-center justify-center text-label">
          Bottom nav only
        </div>
      </section>
    </div>
  ),
}
