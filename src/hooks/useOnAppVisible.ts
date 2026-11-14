import { useEffect, useRef } from 'react'

/** Runs `then` whenever someone comes back to Homami (switching tabs, unlocking the phone) */
export function useOnAppVisible(then: () => void) {
  const thenRef = useRef(then)
  useEffect(() => {
    thenRef.current = then
  })
  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && thenRef.current()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])
}
