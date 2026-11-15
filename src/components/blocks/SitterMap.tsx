import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import clsx from 'clsx'

/**
 * SitterMap — pet sitters on a map, each a round photo pin at their rough spot (about 1 km, never an address).
 * Sara, Nov 15, 2026 (database script 21). OpenStreetMap tiles through Leaflet.
 *   You: a soft sage circle about 1 km wide ("you're around here"), never a precise dot.
 *   A sitter: their photo (or first letter) in a white ring with a sage border; the chosen one gets a dark ring and comes forward.
 *   Two sitters in the same spot are spread a little apart so both can be tapped.
 * Tapping a pin calls `onSelect`; the screen shows that sitter's card under the map.
 */
export interface MapSitter {
  id: string
  name: string
  photoUrl?: string | null
  lat: number
  lng: number
}

export interface SitterMapProps {
  sitters: MapSitter[]
  /** Your rough location, if you've added it */
  me?: { lat: number; lng: number } | null
  selectedId?: string | null
  onSelect?: (id: string) => void
  className?: string
}

const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || undefined

function pin(s: MapSitter, selected: boolean) {
  const el = document.createElement('span')
  el.className = clsx(
    'flex size-[44px] items-center justify-center overflow-hidden rounded-full border-2 bg-light-sage text-body-bold text-dark-sage shadow-nav',
    selected ? 'border-dark-sage outline-2 outline-dark-sage' : 'border-primary-sage',
  )
  if (s.photoUrl) {
    const img = document.createElement('img')
    img.src = s.photoUrl
    img.alt = ''
    img.className = 'size-full object-cover'
    el.append(img)
  } else {
    el.textContent = s.name.slice(0, 1).toUpperCase()
  }
  return L.divIcon({ html: el, className: '', iconSize: [44, 44], iconAnchor: [22, 22] })
}

/** Sitters sharing a spot get spread around it (about 700 m, so both pins show) */
function spread(sitters: MapSitter[]) {
  const seen = new Map<string, number>()
  return sitters.map((s) => {
    const key = `${s.lat},${s.lng}`
    const n = seen.get(key) ?? 0
    seen.set(key, n + 1)
    if (n === 0) return s
    const angle = (n * 2 * Math.PI) / 6
    return { ...s, lat: s.lat + 0.006 * Math.sin(angle), lng: s.lng + 0.008 * Math.cos(angle) }
  })
}

export function SitterMap({ sitters, me, selectedId, onSelect, className }: SitterMapProps) {
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup | null>(null)
  const pick = useRef(onSelect)
  pick.current = onSelect

  // The map itself, once
  useEffect(() => {
    if (!box.current) return
    const m = L.map(box.current, { zoomControl: true, attributionControl: true })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 16,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m)
    m.setView([40, -3.7], 5)
    map.current = m
    layer.current = L.layerGroup().addTo(m)
    return () => {
      m.remove()
      map.current = null
    }
  }, [])

  // Where to look: around you, or around the sitters
  const meKey = me ? `${me.lat},${me.lng}` : ''
  const sittersKey = sitters.map((s) => s.id).join()
  useEffect(() => {
    const m = map.current
    if (!m) return
    if (me) m.setView([me.lat, me.lng], 12)
    else if (sitters.length) m.fitBounds(L.latLngBounds(sitters.map((s) => [s.lat, s.lng])), { padding: [40, 40], maxZoom: 12 })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when you or the list change, not on every new array
  }, [meKey, sittersKey])

  // You and the pins
  useEffect(() => {
    const g = layer.current
    if (!g) return
    g.clearLayers()
    if (me) {
      const sage = token('--color-primary-sage')
      L.circle([me.lat, me.lng], { radius: 1000, color: sage, fillColor: sage, fillOpacity: 0.2, weight: 1, interactive: false }).addTo(g)
    }
    for (const s of spread(sitters)) {
      const selected = s.id === selectedId
      L.marker([s.lat, s.lng], { icon: pin(s, selected), title: s.name, alt: s.name, keyboard: true, zIndexOffset: selected ? 1000 : 0 })
        .on('click', () => pick.current?.(s.id))
        .addTo(g)
    }
  }, [sitters, me, selectedId])

  return <div ref={box} role="region" aria-label="Map of pet sitters" className={clsx('isolate z-0 w-full overflow-hidden rounded-card', className)} />
}
