import { useState } from 'react'
import type { ReactNode } from 'react'
import { LoaderCircle, LocateFixed, MapPin } from 'lucide-react'
import { TextInput } from '../basics/TextInput'
import { TextLink } from '../basics/TextLink'
import type { TextInputProps } from '../basics/TextInput'

/**
 * LocationField — a city or area field whose pin finds you (Sara, Nov 15, 2026; database script 21).
 * Built on TextInput (Figma "InputText" 72:7839) with its tappable `action`: the MapPin that was already there
 * (Figma ONBOARDING 85:10570) now asks the phone where you are.
 *   rest: MapPin, "Tap the pin to use your location" · finding: spinning loader, "Finding you…"
 *   found: LocateFixed, and whatever `onLocate` returns as a note (e.g. "4 pet sitters near you")
 *   problem: the message, in red. You can always type instead.
 *   `onForget` (Nov 15, 2026): once located, "Remove my location" under the field deletes the saved rough area;
 *   the city you typed stays.
 * `onLocate` does the work (find, round to ~1 km, save) and returns the town to fill in, if it found one.
 */
export interface LocationFieldProps extends Omit<TextInputProps, 'icon' | 'action' | 'value' | 'onChange' | 'error'> {
  value: string
  onChange: (value: string) => void
  /** Finds you; returns the town to fill in (or null) and a short note. Throw an Error to show its message. */
  onLocate?: () => Promise<{ place: string | null; note?: ReactNode }>
  /** Already located (e.g. saved before): shows the found state with this note */
  located?: ReactNode
  /** Under the field when nothing has happened yet */
  hint?: ReactNode
  /** "Remove my location": deletes the saved rough area. Throw an Error to show its message. */
  onForget?: () => Promise<void>
}

type State =
  | { step: 'rest' }
  | { step: 'finding' }
  | { step: 'found'; note?: ReactNode }
  | { step: 'problem'; message: string }
  | { step: 'removing' }
  | { step: 'removed' }

export function LocationField({ value, onChange, onLocate, located, hint, helper, onForget, ...rest }: LocationFieldProps) {
  const [state, setState] = useState<State>({ step: 'rest' })
  const found = state.step === 'found' || (state.step === 'rest' && located !== undefined)
  const locate = async () => {
    if (!onLocate || state.step === 'finding') return
    setState({ step: 'finding' })
    try {
      const { place, note } = await onLocate()
      if (place) onChange(place)
      setState({ step: 'found', note })
    } catch (e) {
      setState({ step: 'problem', message: e instanceof Error ? e.message : 'We couldn’t find where you are. Type your city instead.' })
    }
  }
  const forget = async () => {
    if (!onForget) return
    setState({ step: 'removing' })
    try {
      await onForget()
      setState({ step: 'removed' })
    } catch (e) {
      setState({ step: 'problem', message: e instanceof Error ? e.message : 'We couldn’t remove your location. Please try again.' })
    }
  }
  const foundNote =
    state.step === 'found' ? (state.note ?? 'Location added. Only your rough area is kept, never your address.') : state.step === 'rest' ? located : undefined
  const message =
    state.step === 'finding'
      ? 'Finding you…'
      : state.step === 'removing'
        ? 'Removing your location…'
        : state.step === 'removed'
          ? 'Location removed. Tap the pin to add it again.'
          : found
            ? foundNote
            : state.step === 'rest'
              ? (helper ?? hint ?? (onLocate ? 'Tap the pin to use your location' : undefined))
              : undefined
  return (
    <div className="flex w-full flex-col">
      <TextInput
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={state.step === 'problem' ? state.message : undefined}
        helper={message}
        icon={onLocate ? undefined : MapPin}
        action={
          onLocate
            ? {
                icon: state.step === 'finding' ? Spinner : found ? LocateFixed : MapPin,
                label: state.step === 'finding' ? 'Finding your location' : 'Use my location',
                onClick: locate,
              }
            : undefined
        }
      />
      {found && onForget && (
        <TextLink className="self-start" onClick={forget}>
          Remove my location
        </TextLink>
      )}
    </div>
  )
}

/** LoaderCircle, turning */
const Spinner = Object.assign((props: Parameters<typeof LoaderCircle>[0]) => <LoaderCircle {...props} className={`${props.className ?? ''} animate-spin`} />, {
  displayName: 'Spinner',
}) as unknown as typeof LoaderCircle
