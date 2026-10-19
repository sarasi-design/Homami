import type { ReactNode } from 'react'
import { House, Users } from 'lucide-react'
import { Header } from '../components/blocks/Header'
import { BottomNav, bottomNavSpace } from '../components/blocks/BottomNav'
import { AppMenu } from '../components/blocks/AppMenu'

/**
 * The frame of the main pages: header with your photo (opens your profile) and the ≡ menu (Log out),
 * the page, and the bottom nav (Home · Circle; Plans and Chats later, as in Figma 129:8747).
 * Other pages keep the bottom nav with WithBottomNav (below).
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
  /** Next to your photo in the header (Home: the "What's new" field) */
  headerMiddle?: ReactNode
  /** Shows the ≡ menu on the right of the header */
  onLogOut?: () => void
  children: ReactNode
}

export function AppLayout({ me, tab, onTab, onOpenProfile, headerMiddle, onLogOut, children }: AppLayoutProps) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
      <Header me={{ ...me, onOpen: onOpenProfile }} middle={headerMiddle} actions={onLogOut && <AppMenu onLogOut={onLogOut} />} />
      <main className={`flex flex-1 flex-col gap-xl px-l pt-s ${bottomNavSpace}`}>{children}</main>
      <BottomNav items={mainTabs} current={tab} onChange={onTab} />
    </div>
  )
}

export interface WithBottomNavProps {
  /** The highlighted tab, or none (e.g. on Your profile) */
  tab?: 'home' | 'circle'
  onTab: (tab: string) => void
  /** A whole page with its own header (Your profile, Edit pet, someone's profile…) */
  children: ReactNode
}

/**
 * Keeps the bottom nav on the other pages too (Your profile, Edit pet, a person's profile, Invite…),
 * leaving space at the bottom of the page so nothing hides behind it.
 * Not used during first-time setup, so new people finish it first.
 */
export function WithBottomNav({ tab, onTab, children }: WithBottomNavProps) {
  return (
    <>
      <div className="[&>*]:pb-[calc(92px+env(safe-area-inset-bottom))]">{children}</div>
      <BottomNav items={mainTabs} current={tab ?? ''} onChange={onTab} />
    </>
  )
}
