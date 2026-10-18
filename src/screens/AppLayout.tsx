import type { ReactNode } from 'react'
import { House, PawPrint, Users } from 'lucide-react'
import { Header } from '../components/blocks/Header'
import { BottomNav, bottomNavSpace } from '../components/blocks/BottomNav'

/**
 * The frame of the main pages: header with your photo (opens your profile),
 * the page, and the bottom nav (Home · Circle · Sitters; Plans and Chats later).
 */
export const mainTabs = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'circle', label: 'Circle', icon: Users },
  { id: 'sitters', label: 'Sitters', icon: PawPrint },
]

export interface AppLayoutProps {
  me: { name: string; photoUrl?: string | null }
  tab: 'home' | 'circle' | 'sitters'
  onTab: (tab: string) => void
  onOpenProfile: () => void
  children: ReactNode
}

export function AppLayout({ me, tab, onTab, onOpenProfile, children }: AppLayoutProps) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
      <Header me={{ ...me, onOpen: onOpenProfile }} />
      <main className={`flex flex-1 flex-col gap-xl px-l pt-s ${bottomNavSpace}`}>{children}</main>
      <BottomNav items={mainTabs} current={tab} onChange={onTab} />
    </div>
  )
}
