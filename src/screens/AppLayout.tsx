import type { ReactNode } from 'react'
import { House, Users } from 'lucide-react'
import { Header } from '../components/blocks/Header'
import { BottomNav, bottomNavSpace } from '../components/blocks/BottomNav'

/**
 * The frame of the main pages: header with your photo (opens your profile),
 * the page, and the bottom nav (Home · Circle; Plans and Chats later, as in Figma 129:8747).
 * Pet sitters show up on the Home wall, not in their own tab.
 */
export const mainTabs = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'circle', label: 'Circle', icon: Users },
]

export interface AppLayoutProps {
  me: { name: string; photoUrl?: string | null }
  tab: 'home' | 'circle'
  onTab: (tab: string) => void
  onOpenProfile: () => void
  /** Home has no header: your avatar sits next to "What's new" instead */
  header?: boolean
  children: ReactNode
}

export function AppLayout({ me, tab, onTab, onOpenProfile, header = true, children }: AppLayoutProps) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
      {header && <Header me={{ ...me, onOpen: onOpenProfile }} />}
      <main className={`flex flex-1 flex-col gap-xl px-l ${header ? 'pt-s' : 'pt-xl'} ${bottomNavSpace}`}>{children}</main>
      <BottomNav items={mainTabs} current={tab} onChange={onTab} />
    </div>
  )
}
