import { useEffect, useState } from 'react'

/**
 * Tiny page addresses using the part after # (e.g. …/#/circle), so the phone's back button
 * and swipe-back work, and a page can be reloaded without losing your place.
 *   #/            Home
 *   #/circle      Your circle
 *   #/invite      Invite friends
 *   #/profile     Your profile
 *   #/people/ID   Someone in your circle
 */
export function useRoute(): string {
  const read = () => window.location.hash.replace(/^#/, '') || '/'
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const onChange = () => {
      setRoute(read())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export function go(path: string) {
  window.location.hash = path
}

/** Back to the previous page, or Home when there isn't one in the app */
let visited = 0
window.addEventListener('hashchange', () => visited++)

export function goBack() {
  if (visited > 0) window.history.back()
  else go('/')
}
