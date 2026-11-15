// Made-up pet sitters around Málaga for Storybook examples (rough spots, about 1 km).
import { sampleFace } from './sampleFaces'

export const sampleMe = { lat: 36.72, lng: -4.42 }

export const sampleNearbySitters = [
  { id: 'daniel', name: 'Daniel', photoUrl: sampleFace('Daniel', 4), lat: 36.73, lng: -4.41, km: 1, near: true },
  { id: 'marta', name: 'Marta', photoUrl: sampleFace('Marta', 2), lat: 36.71, lng: -4.45, km: 3, near: true },
  { id: 'jorge', name: 'Jorge', photoUrl: null, lat: 36.73, lng: -4.41, km: 1, near: true },
  { id: 'lucia', name: 'Lucía', photoUrl: sampleFace('Lucia', 7), lat: 36.62, lng: -4.5, km: 14, near: false },
]
