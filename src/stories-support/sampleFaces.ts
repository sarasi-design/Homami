// Placeholder faces for Storybook only (generated locally, no network).
// Real profile photos will come from users.
import { createAvatar } from '@dicebear/core'
import { notionists } from '@dicebear/collection'

const backgrounds = ['eef2ec', 'fff7e6', 'f2f1f8', 'f9e0d8', 'eaf5f6']

export function sampleFace(seed: string, i = 0) {
  return createAvatar(notionists, { seed, backgroundColor: [backgrounds[i % backgrounds.length]] }).toDataUri()
}

export const samplePeople = ['Eva Miller', 'Jimmy Chen', 'Vera Rodrigues', 'Daniel Medina', 'Lena Morales', 'Ethan Brooks', 'Maya Patel', 'Noah Kim'].map(
  (name, i) => ({ name, src: sampleFace(name, i) }),
)
