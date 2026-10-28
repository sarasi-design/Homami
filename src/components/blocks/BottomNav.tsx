import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'
import { Icon } from '../basics/Icon'

/**
 * BottomNav — Figma "Bottom nav" (2:1012): white bar, Soft grey line on top, Elevation/Nav shadow,
 * 12px above and 16px below the buttons (plus the phone's home-bar space).
 * Each tab is an icon over a label. The current tab is Dark sage; the others Dark grey.
 * Now: Home, Circle and Chats; Plans joins later.
 * `badge`: a small Primary sage dot with a number on the icon, e.g. unread chats.
 */
export interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  /** e.g. how many chats have unread messages; nothing shows at 0 */
  badge?: number
}

export interface BottomNavProps {
  items: NavItem[]
  current: string
  onChange: (id: string) => void
}

export function BottomNav({ items, current, onChange }: BottomNavProps) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-[480px] border-t border-soft-grey bg-surface pt-m pb-[max(16px,env(safe-area-inset-bottom))] shadow-nav"
    >
      <ul className="flex justify-around px-l">
        {items.map((item) => {
          const active = item.id === current
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onChange(item.id)}
                aria-current={active ? 'page' : undefined}
                aria-label={item.badge ? `${item.label}, ${item.badge} unread` : undefined}
                className={clsx(
                  'flex h-[62px] w-[84px] cursor-pointer flex-col items-center justify-center gap-xs rounded-small',
                  'outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-primary-sage',
                  active ? 'text-dark-sage' : 'text-dark-grey',
                )}
              >
                <span className="relative">
                  <Icon icon={item.icon} size="large" />
                  {!!item.badge && (
                    <span
                      aria-hidden
                      className="absolute -top-[4px] -right-[8px] flex h-[18px] min-w-[18px] items-center justify-center rounded-pill border-2 border-surface bg-primary-sage px-[3px] text-[11px] font-semibold leading-none text-surface"
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </span>
                <span className={active ? 'text-label-bold' : 'text-label'}>{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** Space at the bottom of a page so the last bit isn't hidden behind the bottom nav */
export const bottomNavSpace = 'pb-[120px]'
